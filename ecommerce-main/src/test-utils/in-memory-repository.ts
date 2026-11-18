/**
 * Minimal in-memory stand-in for a TypeORM Repository — just the methods the
 * services use — so HTTP tests can run the real Nest app without a database.
 */
type Row = { id: number; deleted_at?: Date | null; [key: string]: unknown };
type Where = Record<string, unknown>;

export class InMemoryRepository<T extends Row> {
  private rows: T[] = [];
  private nextId = 1;

  constructor(seed: Omit<T, 'id'>[] = []) {
    seed.forEach((r) => this.insert(r));
  }

  insert(data: Omit<T, 'id'>): T {
    const row = { deleted_at: null, ...data, id: this.nextId++ } as T;
    this.rows.push(row);
    return row;
  }

  private live() {
    return this.rows.filter((r) => !r.deleted_at);
  }

  private matches(row: T, where: Where = {}) {
    return Object.entries(where).every(([k, v]) => row[k] === v);
  }

  find(options: { where?: Where } = {}): Promise<T[]> {
    return Promise.resolve(
      this.live()
        .filter((r) => this.matches(r, options.where))
        .map((r) => ({ ...r })),
    );
  }

  findOne(options: { where: Where }): Promise<T | null> {
    const row = this.live().find((r) => this.matches(r, options.where));
    return Promise.resolve(row ? { ...row } : null);
  }

  create(data: Partial<T>): T {
    return { ...data } as T;
  }

  save(entity: Partial<T>): Promise<T> {
    return Promise.resolve({ ...this.insert(entity as Omit<T, 'id'>) });
  }

  update(id: number, changes: Partial<T>) {
    const row = this.rows.find((r) => r.id === id);
    if (row) Object.assign(row, changes);
    return Promise.resolve({ affected: row ? 1 : 0 });
  }

  softDelete(id: number) {
    const row = this.live().find((r) => r.id === id);
    if (row) row.deleted_at = new Date();
    return Promise.resolve({ affected: row ? 1 : 0 });
  }
}
