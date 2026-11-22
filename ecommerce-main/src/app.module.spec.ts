import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Boots the real AppModule — every module, controller and the TypeORM wiring —
 * without a database: DataSource.initialize builds entity metadata (so
 * repositories can be created) but never opens a connection.
 */
describe('AppModule', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    jest
      .spyOn(DataSource.prototype, 'initialize')
      .mockImplementation(async function (this: DataSource) {
        // buildMetadatas is protected; it only reads the entity classes.
        await (
          this as unknown as { buildMetadatas(): Promise<void> }
        ).buildMetadatas();
        return this;
      });
    jest.spyOn(DataSource.prototype, 'destroy').mockResolvedValue();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it('configures TypeORM from the environment, with every entity registered', () => {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    expect(dataSource.options.type).toBe('postgres');
    expect(dataSource.entityMetadatas.map((m) => m.tableName).sort()).toEqual([
      'admins',
      'images',
      'products',
    ]);
  });

  it('serves the root, products, auth and images routes', async () => {
    const http = () => request(app.getHttpServer());
    await http().get('/').expect(200);
    // Validation runs before any database access, proving each route exists.
    await http().get('/products?category=phones').expect(400);
    await http().post('/auth/login').send({ email: 'nope' }).expect(400);
    await http().post('/images').expect(401);
  });
});
