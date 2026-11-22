import { CATALOG } from './catalog';

type Saved = Record<string, unknown>;

/**
 * seed.ts runs as soon as it's imported (it's a CLI script), so each test
 * swaps in a fake data source and imports a fresh copy.
 */
describe('seed script', () => {
  const argv = process.argv;
  let ds: ReturnType<typeof fakeDataSource>;

  function fakeDataSource(existing = 0) {
    const repo = {
      count: jest.fn(() => Promise.resolve(existing)),
      create: jest.fn((row: Saved) => row),
      save: jest.fn((rows: Saved[]) => Promise.resolve(rows)),
    };
    return {
      repo,
      isInitialized: false,
      initialize: jest.fn(function (this: { isInitialized: boolean }) {
        this.isInitialized = true;
        return Promise.resolve(this);
      }),
      getRepository: jest.fn(() => repo),
      query: jest.fn(() => Promise.resolve()),
      destroy: jest.fn(() => Promise.resolve()),
    };
  }

  async function runSeed(args: string[] = [], existing = 0) {
    ds = fakeDataSource(existing);
    process.argv = ['node', 'seed.js', ...args];
    jest.resetModules();
    jest.doMock('../data-source', () => ({ __esModule: true, default: ds }));
    await import('./seed');
    // The script's promise isn't exported; let it run to completion.
    await new Promise(setImmediate);
  }

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    process.argv = argv;
    jest.restoreAllMocks();
  });

  it('loads the whole catalog into an empty database, then disconnects', async () => {
    await runSeed();
    expect(ds.repo.count).toHaveBeenCalledWith({ withDeleted: true });
    const [rows] = ds.repo.save.mock.calls[0] as unknown as [Saved[]];
    expect(rows).toHaveLength(CATALOG.length);
    expect(ds.destroy).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      `Seeded ${CATALOG.length} products.`,
    );
  });

  it('maps catalog entries to product rows', async () => {
    await runSeed();
    const [rows] = ds.repo.save.mock.calls[0] as unknown as [Saved[]];
    const first = CATALOG[0];
    expect(rows[0]).toEqual({
      name: first.name,
      category: first.category,
      description: first.description,
      price: first.price,
      currency: 'EUR',
      available_quantity: first.available_quantity,
      featured: first.featured ?? false,
      sold_from: first.sold_from ?? null,
      sold_to: null,
      image_url: `/products/${first.image}`,
      gallery: (first.gallery ?? []).map((f) => `/products/${f}`),
      specs: first.specs.map(([label, value]) => ({ label, value })),
    });
    // Entries without an image or gallery get null / [].
    const bare = CATALOG.findIndex((p) => !p.image && !p.gallery);
    if (bare >= 0) {
      expect(rows[bare]).toMatchObject({ image_url: null, gallery: [] });
    }
  });

  it('skips seeding when products already exist (even soft-deleted ones)', async () => {
    await runSeed([], 3);
    expect(ds.repo.save).not.toHaveBeenCalled();
    expect(ds.destroy).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('skipping'),
    );
  });

  it('with --reset, deletes every product before loading', async () => {
    await runSeed(['--reset'], 3);
    expect(ds.query).toHaveBeenCalledWith(
      'TRUNCATE "products" RESTART IDENTITY',
    );
    expect(ds.repo.count).not.toHaveBeenCalled();
    expect(ds.repo.save).toHaveBeenCalled();
  });

  it('on failure, logs the error, disconnects and exits with code 1', async () => {
    const exit = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    ds = fakeDataSource();
    const boom = new Error('connection refused');
    ds.getRepository.mockImplementation(() => {
      throw boom;
    });
    process.argv = ['node', 'seed.js'];
    jest.resetModules();
    jest.doMock('../data-source', () => ({ __esModule: true, default: ds }));
    await import('./seed');
    await new Promise(setImmediate);

    expect(console.error).toHaveBeenCalledWith(boom);
    expect(ds.destroy).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('does not try to disconnect if it never connected', async () => {
    jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    ds = fakeDataSource();
    ds.initialize.mockRejectedValue(new Error('bad password'));
    process.argv = ['node', 'seed.js'];
    jest.resetModules();
    jest.doMock('../data-source', () => ({ __esModule: true, default: ds }));
    await import('./seed');
    await new Promise(setImmediate);
    expect(ds.destroy).not.toHaveBeenCalled();
  });
});
