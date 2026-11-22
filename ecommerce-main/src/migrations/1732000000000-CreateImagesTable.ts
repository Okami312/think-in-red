import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImagesTable1732000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // IF NOT EXISTS: in development `synchronize` may have created it already.
    // gen_random_uuid() is built into Postgres 13+.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "images" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "mime_type" VARCHAR(50) NOT NULL,
        "size" INTEGER NOT NULL,
        "data" BYTEA NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "images"`);
  }
}
