import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AdminEntity } from '../admins/admin.entity/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { InMemoryRepository } from '../test-utils/in-memory-repository';
import { ProductEntity } from './product.entity/product.entity';
import { ProductsModule } from './products.module';

/**
 * HTTP-level tests: the real controllers, global ValidationPipe, JWT guard and
 * exception handling — with in-memory repositories instead of PostgreSQL.
 */
const laptop = {
  name: 'ThinkPad T470',
  category: 'laptops',
  description: 'The 2017 all-rounder.',
  price: 199,
  currency: 'EUR',
  available_quantity: 5,
  sold_from: null,
  sold_to: null,
  image_url: null,
  gallery: [],
  specs: [{ label: 'Released', value: '2017' }],
  featured: false,
};
type ProductBody = { id: number; name: string; category: string } & Record<
  string,
  unknown
>;
type LoginBody = { access_token: string; admin: Record<string, unknown> };
/** supertest bodies are `any`; give them a shape for the assertions. */
const body = <T>(res: request.Response) => res.body as T;

const mouse = {
  ...laptop,
  name: 'ThinkPad Bluetooth Silent Mouse',
  category: 'mice',
  price: 22,
};

describe('Products & auth API (HTTP)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const admins = new InMemoryRepository([
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: await bcrypt.hash('admin123', 4),
      },
    ]);
    const products = new InMemoryRepository([laptop, mouse]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        ProductsModule,
        AuthModule,
      ],
    })
      .overrideProvider(getRepositoryToken(ProductEntity))
      .useValue(products)
      .overrideProvider(getRepositoryToken(AdminEntity))
      .useValue(admins)
      .compile();

    app = moduleRef.createNestApplication();
    // same as main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    token = body<LoginBody>(res).access_token;
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const valid = {
    name: 'ThinkPad X220',
    category: 'laptops',
    description: 'The cult classic.',
    price: 169,
    currency: 'EUR',
    available_quantity: 3,
  };

  describe('POST /auth/login', () => {
    it('returns a token and the admin (without the password hash)', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' })
        .expect(200);
      expect(body<LoginBody>(res).access_token).toEqual(expect.any(String));
      expect(body<LoginBody>(res).admin).toEqual({
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
      });
    });

    it('rejects a wrong password with 401', () =>
      http()
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'nope' })
        .expect(401));

    it('rejects a malformed email with 400', () =>
      http()
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'x' })
        .expect(400));
  });

  describe('GET /products', () => {
    it('lists products', async () => {
      const res = await http().get('/products').expect(200);
      expect(body<ProductBody[]>(res).map((p) => p.name)).toEqual(
        expect.arrayContaining([
          'ThinkPad T470',
          'ThinkPad Bluetooth Silent Mouse',
        ]),
      );
    });

    it('filters by category', async () => {
      const res = await http().get('/products?category=mice').expect(200);
      expect(body<ProductBody[]>(res)).toHaveLength(1);
      expect(body<ProductBody[]>(res)[0].category).toBe('mice');
    });

    it('rejects an unknown category with 400', () =>
      http().get('/products?category=phones').expect(400));

    it('returns one product, 400 for a non-numeric id and 404 for a missing one', async () => {
      await http().get('/products/1').expect(200);
      await http().get('/products/abc').expect(400);
      await http().get('/products/999').expect(404);
    });
  });

  describe('POST /products', () => {
    it('requires a token', async () => {
      await http().post('/products').send(valid).expect(401);
      await http()
        .post('/products')
        .set('Authorization', 'Bearer not-a-real-token')
        .send(valid)
        .expect(401);
    });

    it('creates a product with sensible defaults and strips unknown fields', async () => {
      const res = await http()
        .post('/products')
        .set(auth())
        .send({ ...valid, isAdmin: true })
        .expect(201);
      expect(res.body).toMatchObject({
        ...valid,
        sold_from: null,
        sold_to: null,
        image_url: null,
        gallery: [],
        specs: [],
        featured: false,
      });
      expect(res.body).not.toHaveProperty('isAdmin');
    });

    it('returns readable validation errors', async () => {
      const res = await http()
        .post('/products')
        .set(auth())
        .send({ ...valid, category: 'phones', price: -1, gallery: ['nope'] })
        .expect(400);
      const messages = body<{ message: string[] }>(res).message.join(' | ');
      expect(messages).toContain('category must be one of');
      expect(messages).toContain('price must not be less than 0');
      expect(messages).toContain('gallery entry must be');
    });
  });

  describe('PUT /products/:id', () => {
    it('updates only the fields sent; null clears the image', async () => {
      const created = await http()
        .post('/products')
        .set(auth())
        .send({ ...valid, image_url: '/products/x220.webp' })
        .expect(201);
      const res = await http()
        .put(`/products/${body<ProductBody>(created).id}`)
        .set(auth())
        .send({ price: 149, image_url: null })
        .expect(200);
      expect(res.body).toMatchObject({
        name: valid.name,
        price: 149,
        image_url: null,
      });
    });

    it('rejects an end date before the start date', () =>
      http()
        .put('/products/1')
        .set(auth())
        .send({ sold_from: '2026-06-01', sold_to: '2026-05-01' })
        .expect(400));
  });

  describe('DELETE /products/:id', () => {
    it('soft-deletes (204), after which the product is gone (404)', async () => {
      const created = await http()
        .post('/products')
        .set(auth())
        .send(valid)
        .expect(201);
      await http()
        .delete(`/products/${body<ProductBody>(created).id}`)
        .set(auth())
        .expect(204);
      await http()
        .get(`/products/${body<ProductBody>(created).id}`)
        .expect(404);
      await http()
        .delete(`/products/${body<ProductBody>(created).id}`)
        .set(auth())
        .expect(404);
    });
  });
});
