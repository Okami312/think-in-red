import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1731900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // IF NOT EXISTS everywhere: in development `synchronize` may already have
    // created the table/columns before migrations run.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "category" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL,
        "available_quantity" INTEGER NOT NULL,
        "sold_from" DATE,
        "sold_to" DATE,
        "deleted_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(2048),
        ADD COLUMN IF NOT EXISTS "specs" JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
