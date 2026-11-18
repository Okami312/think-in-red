import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './config/database.config';

// Used by the TypeORM CLI (`npm run migration:run`) and the seed script.
// Never auto-syncs: the CLI should only apply real migrations.
export default new DataSource({
  ...buildDatabaseOptions(process.env),
  synchronize: false,
  migrationsRun: false,
  logging: ['error', 'warn', 'migration'],
});
