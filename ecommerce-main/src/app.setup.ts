import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * App-wide setup shared by main.ts and the HTTP tests, so tests exercise the
 * same validation and CORS rules as the running server.
 */
export function configureApp<T extends INestApplication>(
  app: T,
  env: Record<string, string | undefined> = process.env,
): T {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip fields that are not in the DTO
      transform: true,
    }),
  );
  app.enableCors({
    // Comma-separated list, e.g. "http://localhost:5173,https://shop.example"
    origin: (env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  return app;
}
