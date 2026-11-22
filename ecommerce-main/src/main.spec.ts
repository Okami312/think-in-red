/**
 * main.ts starts the server as soon as it's imported. Nest and AppModule are
 * mocked at the module level (these mocks survive jest.resetModules), so no
 * real server or database connection is ever created.
 */
const app = {
  useGlobalPipes: jest.fn(),
  enableCors: jest.fn(),
  listen: jest.fn(() => Promise.resolve()),
};
const create = jest.fn(() => Promise.resolve(app));

jest.mock('@nestjs/core', () => ({ NestFactory: { create } }));
jest.mock('./app.module', () => ({ AppModule: class FakeAppModule {} }));

describe('main.ts bootstrap', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...env };
  });
  afterAll(() => {
    process.env = env;
  });

  /** Importing main.ts runs bootstrap once; wait for it to finish. */
  async function importMain() {
    await import('./main');
    await new Promise(setImmediate);
  }

  it('creates AppModule with the shared setup and listens on PORT', async () => {
    process.env.PORT = '4321';
    await importMain();
    const { AppModule } = jest.requireMock<{ AppModule: unknown }>(
      './app.module',
    );
    expect(create).toHaveBeenCalledWith(AppModule);
    expect(app.useGlobalPipes).toHaveBeenCalled();
    expect(app.enableCors).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledWith('4321');
  });

  it('defaults to port 3000', async () => {
    delete process.env.PORT;
    await importMain();
    expect(app.listen).toHaveBeenCalledWith(3000);
  });
});
