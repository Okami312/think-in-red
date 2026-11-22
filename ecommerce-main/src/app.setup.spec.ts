import { INestApplication, ValidationPipe } from '@nestjs/common';
import { configureApp } from './app.setup';

function fakeApp() {
  return {
    useGlobalPipes: jest.fn(),
    enableCors: jest.fn(),
  } as unknown as INestApplication & {
    useGlobalPipes: jest.Mock;
    enableCors: jest.Mock;
  };
}

describe('configureApp', () => {
  it('validates bodies, stripping unknown fields and converting types', () => {
    const app = fakeApp();
    configureApp(app, {});
    const [pipe] = app.useGlobalPipes.mock.calls[0] as [ValidationPipe];
    expect(pipe).toBeInstanceOf(ValidationPipe);
    expect(pipe).toMatchObject({
      validatorOptions: expect.objectContaining({ whitelist: true }) as object,
      isTransformEnabled: true,
    });
  });

  it('allows the local Vite dev server by default', () => {
    const app = fakeApp();
    configureApp(app, {});
    expect(app.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({ origin: ['http://localhost:5173'] }),
    );
  });

  it('reads a comma-separated list of origins from CORS_ORIGIN', () => {
    const app = fakeApp();
    configureApp(app, {
      CORS_ORIGIN: 'https://shop.example,https://admin.example',
    });
    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ['https://shop.example', 'https://admin.example'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  });
});
