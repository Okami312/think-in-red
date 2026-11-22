import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../app.setup';
import { AdminEntity } from '../admins/admin.entity/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { InMemoryRepository } from '../test-utils/in-memory-repository';
import { ImageEntity } from './image.entity';
import { ImagesModule } from './images.module';
import { MAX_IMAGE_BYTES } from './image-type';

// Smallest valid-looking PNG header + padding; only the signature is checked.
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 1),
]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBP'),
  Buffer.alloc(16, 1),
]);

/** In-memory image table keyed by UUID (the shared helper uses numeric IDs). */
function imageRepo() {
  const rows = new Map<string, ImageEntity>();
  let n = 0;
  return {
    create: (data: Partial<ImageEntity>) => ({ ...data }) as ImageEntity,
    save: (img: ImageEntity) => {
      const id = `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
      const row = { ...img, id, created_at: new Date() };
      rows.set(id, row);
      return Promise.resolve(row);
    },
    findOne: ({ where }: { where: { id: string } }) =>
      Promise.resolve(rows.get(where.id) ?? null),
  };
}

describe('Images API (HTTP)', () => {
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
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        ImagesModule,
        AuthModule,
      ],
    })
      .overrideProvider(getRepositoryToken(ImageEntity))
      .useValue(imageRepo())
      .overrideProvider(getRepositoryToken(AdminEntity))
      .useValue(admins)
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    token = (res.body as { access_token: string }).access_token;
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('requires a token to upload', () =>
    http().post('/images').attach('file', PNG, 'a.png').expect(401));

  it('stores an upload and serves it back with its detected type', async () => {
    const res = await http()
      .post('/images')
      .set(auth())
      .attach('file', WEBP, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);
    const { url } = res.body as { url: string };
    expect(url).toMatch(/^\/images\/[0-9a-f-]{36}$/);

    const img = await http().get(url).expect(200);
    // Type comes from the bytes, not the client's claimed image/jpeg.
    expect(img.headers['content-type']).toBe('image/webp');
    expect(img.headers['cache-control']).toContain('immutable');
    expect(img.headers['x-content-type-options']).toBe('nosniff');
    expect(Buffer.compare(img.body as Buffer, WEBP)).toBe(0);
  });

  it('rejects files that are not images, including SVG', async () => {
    await http()
      .post('/images')
      .set(auth())
      .attach('file', Buffer.from('<svg onload="alert(1)"></svg>'), 'x.svg')
      .expect(400);
    await http()
      .post('/images')
      .set(auth())
      .attach('file', Buffer.from('just some text, not an image'), 'x.png')
      .expect(400);
  });

  it('rejects a request without a file, or with an empty one', async () => {
    await http().post('/images').set(auth()).expect(400);
    await http()
      .post('/images')
      .set(auth())
      .attach('file', Buffer.alloc(0), 'empty.png')
      .expect(400);
  });

  it('rejects files over the size limit with 413', () =>
    http()
      .post('/images')
      .set(auth())
      .attach(
        'file',
        Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]),
        'big.png',
      )
      .expect(413));

  it('returns 404 for unknown or malformed image IDs', async () => {
    await http()
      .get('/images/00000000-0000-4000-8000-999999999999')
      .expect(404);
    await http().get('/images/not-a-uuid').expect(404);
  });
});
