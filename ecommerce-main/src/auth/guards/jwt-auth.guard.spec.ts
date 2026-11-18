import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextWith(authorization?: string) {
  const request: { headers: Record<string, string>; admin?: unknown } = {
    headers: authorization ? { authorization } : {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  const guard = new JwtAuthGuard(jwt);

  it('rejects a request with no token', async () => {
    await expect(guard.canActivate(contextWith().context)).rejects.toThrow(
      new UnauthorizedException('No token provided'),
    );
  });

  it('rejects a non-Bearer scheme', async () => {
    const token = jwt.sign({ sub: 1 });
    await expect(
      guard.canActivate(contextWith(`Basic ${token}`).context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = new JwtService({ secret: 'other' }).sign({ sub: 1 });
    await expect(
      guard.canActivate(contextWith(`Bearer ${forged}`).context),
    ).rejects.toThrow(new UnauthorizedException('Invalid token'));
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ sub: 1 }, { expiresIn: -10 });
    await expect(
      guard.canActivate(contextWith(`Bearer ${expired}`).context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid token and attaches the payload to the request', async () => {
    const { context, request } = contextWith(
      `Bearer ${jwt.sign({ sub: 1, email: 'a@b.c' })}`,
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.admin).toMatchObject({ sub: 1, email: 'a@b.c' });
  });
});
