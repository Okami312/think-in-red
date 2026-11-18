import type { DataSourceOptions } from 'typeorm';

type Env = Record<string, string | undefined>;

/**
 * Shared by the Nest app (app.module.ts) and the CLI data source
 * (data-source.ts) used for migrations and seeding.
 *
 * Connection: DATABASE_URL (e.g. from Neon) wins; otherwise DB_HOST/DB_PORT/...
 * SSL: on when DB_SSL=true or the URL has sslmode=require.
 */
export function buildDatabaseOptions(
  env: Env = process.env,
): DataSourceOptions {
  const isProduction = env.NODE_ENV === 'production';
  const url = env.DATABASE_URL;
  const ssl = env.DB_SSL === 'true' || /sslmode=require/.test(url ?? '');

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: env.DB_HOST ?? 'localhost',
          port: Number(env.DB_PORT ?? 5432),
          username: env.DB_USERNAME ?? 'postgres',
          password: env.DB_PASSWORD ?? 'postgres',
          database: env.DB_DATABASE ?? 'ecommerce',
        }),
    ssl: ssl ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // Development: auto-sync schema and run migrations on startup.
    // Production: schema changes only via `npm run migration:run`.
    synchronize: !isProduction,
    migrationsRun: (env.DB_MIGRATIONS_RUN ?? String(!isProduction)) === 'true',
    logging: !isProduction,
    // Serverless (Vercel) keeps few connections per instance.
    extra: { max: Number(env.DB_POOL_MAX ?? (isProduction ? 3 : 10)) },
  };
}
