# ThinkInRed — API

NestJS + TypeORM + PostgreSQL backend for the ThinkInRed portfolio store. Not affiliated with Lenovo.

## Run locally

```bash
cp .env.example .env    # then set JWT_SECRET
npm install
npm run start:dev       # http://localhost:3000 — creates tables + seeds the admin
npm run seed            # load the demo catalog (18 products) if the table is empty
```

Admin login: `admin@example.com` / `admin123` (change via `ADMIN_EMAIL` / `ADMIN_PASSWORD` before the first run).

## Scripts

| Script                     | What                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `npm run start:dev`        | Dev server with watch mode                                  |
| `npm run migration:run`    | Apply migrations (use this in production)                   |
| `npm run seed`             | Load the demo catalog if there are no products              |
| `npm run seed -- --reset`  | **Delete all products** and reload the catalog              |
| `npm test`                 | Unit tests                                                  |

## API

| Method | Path                         | Auth | Notes                                         |
| ------ | ---------------------------- | ---- | --------------------------------------------- |
| POST   | `/auth/login`                |      | `{ email, password }` → `{ access_token, admin }` |
| GET    | `/products?category=laptops` |      | Category is optional                          |
| GET    | `/products/:id`              |      |                                               |
| POST   | `/products`                  | JWT  |                                               |
| PUT    | `/products/:id`              | JWT  | Partial update; `null` clears dates/image     |
| DELETE | `/products/:id`              | JWT  | Soft delete                                   |

Categories: `laptops`, `monitors`, `keyboards`, `mice`, `bags`, `desktops`.
Products also have `image_url`, `featured`, and `specs: [{ label, value }]`.

## Configuration

See `.env.example`. In production set `NODE_ENV=production`, `DATABASE_URL` (e.g. Neon,
with `sslmode=require`), `JWT_SECRET` and `CORS_ORIGIN` (the frontend URL), and run
`npm run migration:run` instead of relying on auto-sync.
