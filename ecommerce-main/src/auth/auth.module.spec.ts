import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminEntity } from '../admins/admin.entity/admin.entity';
import { AuthModule } from './auth.module';

/** Compiles AuthModule with the given environment (no .env file, no database). */
function compile(env: Record<string, string>) {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        ignoreEnvVars: true,
        load: [() => env],
      }),
      AuthModule,
    ],
  })
    .overrideProvider(getRepositoryToken(AdminEntity))
    .useValue({})
    .compile();
}

const payload = (jwt: JwtService, token: string) =>
  jwt.decode<{ iat: number; exp: number }>(token);

describe('AuthModule JWT configuration', () => {
  it('signs with JWT_SECRET and JWT_EXPIRES_IN', async () => {
    const jwt = (
      await compile({ JWT_SECRET: 'abc', JWT_EXPIRES_IN: '2h' })
    ).get(JwtService);
    const token = jwt.sign({ sub: 1 });
    expect(jwt.verify<{ sub: number }>(token, { secret: 'abc' })).toMatchObject(
      { sub: 1 },
    );
    const { iat, exp } = payload(jwt, token);
    expect(exp - iat).toBe(2 * 60 * 60);
  });

  it('falls back to a dev-only secret and a 1-day expiry outside production', async () => {
    const jwt = (await compile({})).get(JwtService);
    const token = jwt.sign({ sub: 1 });
    expect(
      jwt.verify<{ sub: number }>(token, {
        secret: 'dev-only-insecure-secret',
      }),
    ).toMatchObject({ sub: 1 });
    const { iat, exp } = payload(jwt, token);
    expect(exp - iat).toBe(24 * 60 * 60);
  });

  it('refuses to start in production without JWT_SECRET', async () => {
    await expect(compile({ NODE_ENV: 'production' })).rejects.toThrow(
      'JWT_SECRET must be set in production',
    );
  });
});
