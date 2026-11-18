import dataSource from '../data-source';
import { ProductEntity } from '../products/product.entity/product.entity';
import { CATALOG } from './catalog';

/**
 * Loads the demo catalog.
 *   npm run seed            → only if there are no products yet
 *   npm run seed -- --reset → deletes ALL products first, then loads
 */
async function main() {
  const reset = process.argv.includes('--reset');
  await dataSource.initialize();
  const repo = dataSource.getRepository(ProductEntity);

  if (reset) {
    await dataSource.query('TRUNCATE "products" RESTART IDENTITY');
    console.log('Deleted all products.');
  } else if ((await repo.count({ withDeleted: true })) > 0) {
    console.log(
      'Products already exist — skipping. Use --reset to replace them.',
    );
    await dataSource.destroy();
    return;
  }

  await repo.save(
    CATALOG.map((p) =>
      repo.create({
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        currency: 'EUR',
        available_quantity: p.available_quantity,
        featured: p.featured ?? false,
        sold_from: p.sold_from ?? null,
        sold_to: null,
        image_url: p.image ? `/products/${p.image}` : null,
        gallery: (p.gallery ?? []).map((file) => `/products/${file}`),
        specs: p.specs.map(([label, value]) => ({ label, value })),
      }),
    ),
  );
  console.log(`Seeded ${CATALOG.length} products.`);
  await dataSource.destroy();
}

main().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
