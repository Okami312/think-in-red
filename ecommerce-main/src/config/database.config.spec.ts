import { buildDatabaseOptions } from './database.config';

describe('buildDatabaseOptions', () => {
  it('uses local Postgres defaults in development', () => {
    expect(buildDatabaseOptions({})).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'ecommerce',
      ssl: false,
      synchronize: true,
      migrationsRun: true,
      logging: true,
      extra: { max: 10 },
    });
  });

  it('reads the DB_* variables', () => {
    expect(
      buildDatabaseOptions({
        DB_HOST: 'db.internal',
        DB_PORT: '6543',
        DB_USERNAME: 'shop',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'store',
      }),
    ).toMatchObject({
      host: 'db.internal',
      port: 6543,
      username: 'shop',
      password: 'secret',
      database: 'store',
    });
  });

  it('prefers DATABASE_URL and turns on SSL when it asks for it', () => {
    const options = buildDatabaseOptions({
      DATABASE_URL: 'postgres://u:p@neon.example/db?sslmode=require',
      DB_HOST: 'ignored',
    });
    expect(options).toMatchObject({
      url: 'postgres://u:p@neon.example/db?sslmode=require',
      ssl: { rejectUnauthorized: false },
    });
    expect(options).not.toHaveProperty('host');
  });

  it('turns on SSL with DB_SSL=true', () => {
    expect(buildDatabaseOptions({ DB_SSL: 'true' })).toMatchObject({
      ssl: { rejectUnauthorized: false },
    });
  });

  it('never auto-syncs or auto-migrates in production, and keeps the pool small', () => {
    expect(buildDatabaseOptions({ NODE_ENV: 'production' })).toMatchObject({
      synchronize: false,
      migrationsRun: false,
      logging: false,
      extra: { max: 3 },
    });
  });

  it('lets DB_MIGRATIONS_RUN and DB_POOL_MAX override the defaults', () => {
    expect(
      buildDatabaseOptions({
        NODE_ENV: 'production',
        DB_MIGRATIONS_RUN: 'true',
        DB_POOL_MAX: '7',
      }),
    ).toMatchObject({ migrationsRun: true, extra: { max: 7 } });
    expect(
      buildDatabaseOptions({ DB_MIGRATIONS_RUN: 'false' }).migrationsRun,
    ).toBe(false);
  });

  it('finds entities and migrations next to the compiled or source files', () => {
    const options = buildDatabaseOptions({});
    expect(options.entities).toEqual([
      expect.stringMatching(/\*\*\/\*\.entity\{\.ts,\.js\}$/),
    ]);
    expect(options.migrations).toEqual([
      expect.stringMatching(/migrations\/\*\{\.ts,\.js\}$/),
    ]);
  });

  it('reads process.env when no environment is passed', () => {
    const env = process.env;
    process.env = { ...env, DB_HOST: 'from-process-env', DATABASE_URL: '' };
    try {
      expect(buildDatabaseOptions()).toMatchObject({
        host: 'from-process-env',
      });
    } finally {
      process.env = env;
    }
  });
});
