describe('CLI data source (migrations and seeding)', () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
    jest.resetModules();
  });

  async function load(vars: Record<string, string>) {
    process.env = { ...env, ...vars };
    return (await import('./data-source')).default;
  }

  it('uses the app database settings but never auto-syncs or auto-migrates', async () => {
    const ds = await load({ DATABASE_URL: 'postgres://u:p@example/db' });
    expect(ds.isInitialized).toBe(false); // importing doesn't connect
    expect(ds.options).toMatchObject({
      type: 'postgres',
      url: 'postgres://u:p@example/db',
      synchronize: false,
      migrationsRun: false,
      logging: ['error', 'warn', 'migration'],
    });
  });
});
