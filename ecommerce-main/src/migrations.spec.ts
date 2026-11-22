import * as bcrypt from 'bcrypt';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { CreateAdminsTable1710000000000 } from './migrations/1710000000000-CreateAdminsTable';
import { CreateProductsTable1731900000000 } from './migrations/1731900000000-CreateProductsTable';
import { AddProductGallery1731990000000 } from './migrations/1731990000000-AddProductGallery';
import { CreateImagesTable1732000000000 } from './migrations/1732000000000-CreateImagesTable';

// Kept outside migrations/: TypeORM loads every file in that folder as a migration.

/** Records the SQL a migration sends instead of running it. */
function recorder() {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const runner = {
    query: jest.fn((sql: string, params?: unknown[]) => {
      calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      return Promise.resolve();
    }),
  } as unknown as QueryRunner;
  return { runner, calls, sql: () => calls.map((c) => c.sql) };
}

async function run(migration: MigrationInterface, dir: 'up' | 'down') {
  const r = recorder();
  await migration[dir](r.runner);
  return r;
}

describe('migrations', () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
  });

  describe('CreateAdminsTable', () => {
    it('creates the table idempotently and seeds the admin with a bcrypt hash', async () => {
      process.env = {
        ...env,
        ADMIN_EMAIL: 'owner@shop.example',
        ADMIN_PASSWORD: 's3cret!',
      };
      const { calls } = await run(new CreateAdminsTable1710000000000(), 'up');
      expect(calls[0].sql).toMatch(/^CREATE TABLE IF NOT EXISTS "admins"/);
      expect(calls[0].sql).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');

      const insert = calls[1];
      expect(insert.sql).toContain('ON CONFLICT (email) DO NOTHING');
      const [email, hash] = insert.params as [string, string];
      expect(email).toBe('owner@shop.example');
      expect(hash).not.toBe('s3cret!'); // never stored in plain text
      await expect(bcrypt.compare('s3cret!', hash)).resolves.toBe(true);
    });

    it('falls back to the documented default admin', async () => {
      process.env = { ...env, ADMIN_EMAIL: '', ADMIN_PASSWORD: '' };
      const { calls } = await run(new CreateAdminsTable1710000000000(), 'up');
      const [email, hash] = calls[1].params as [string, string];
      expect(email).toBe('admin@example.com');
      await expect(bcrypt.compare('admin123', hash)).resolves.toBe(true);
    });

    it('drops the table on revert', async () => {
      const r = await run(new CreateAdminsTable1710000000000(), 'down');
      expect(r.sql()).toEqual(['DROP TABLE "admins"']);
    });
  });

  it.each([
    [
      'CreateProductsTable',
      new CreateProductsTable1731900000000(),
      /^CREATE TABLE IF NOT EXISTS "products"/,
    ],
    [
      'AddProductGallery',
      new AddProductGallery1731990000000(),
      /^ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gallery" JSONB/,
    ],
    [
      'CreateImagesTable',
      new CreateImagesTable1732000000000(),
      /^CREATE TABLE IF NOT EXISTS "images" .*"data" BYTEA NOT NULL/,
    ],
  ])(
    '%s is safe to run after synchronize already created the schema',
    async (_name, migration, expected) => {
      const r = await run(migration, 'up');
      expect(r.sql()[0]).toMatch(expected);
    },
  );

  it.each([
    [
      'CreateProductsTable',
      new CreateProductsTable1731900000000(),
      'DROP TABLE "products"',
    ],
    [
      'AddProductGallery',
      new AddProductGallery1731990000000(),
      'ALTER TABLE "products" DROP COLUMN "gallery"',
    ],
    [
      'CreateImagesTable',
      new CreateImagesTable1732000000000(),
      'DROP TABLE "images"',
    ],
  ])('%s reverts cleanly', async (_name, migration, expected) => {
    const r = await run(migration, 'down');
    expect(r.sql()).toEqual([expected]);
  });
});
