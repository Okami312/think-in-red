import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

const valid = {
  name: 'ThinkPad X1 Carbon Gen 13',
  category: 'laptops',
  description: 'Light.',
  price: 1899,
  currency: 'USD',
  available_quantity: 3,
};

async function errorsFor(body: object) {
  const errors = await validate(plainToInstance(CreateProductDto, body));
  return errors.map((e) => e.property);
}

describe('CreateProductDto', () => {
  it('accepts a minimal valid product', async () => {
    expect(await errorsFor(valid)).toEqual([]);
  });

  it('rejects categories outside the fixed list', async () => {
    expect(await errorsFor({ ...valid, category: 'phones' })).toEqual([
      'category',
    ]);
  });

  it('validates each spec row', async () => {
    expect(
      await errorsFor({ ...valid, specs: [{ label: 'RAM', value: '32 GB' }] }),
    ).toEqual([]);
    expect(
      await errorsFor({ ...valid, specs: [{ label: '', value: 1 }] }),
    ).toEqual(['specs']);
  });

  it('validates every gallery entry', async () => {
    expect(
      await errorsFor({
        ...valid,
        gallery: ['/products/a.webp', 'https://x.io/b.jpg'],
      }),
    ).toEqual([]);
    expect(
      await errorsFor({ ...valid, gallery: ['/products/a.webp', 'nope'] }),
    ).toEqual(['gallery']);
  });

  it('requires image_url to be an http(s) URL or a site path', async () => {
    expect(
      await errorsFor({ ...valid, image_url: 'https://example.com/x.jpg' }),
    ).toEqual([]);
    expect(await errorsFor({ ...valid, image_url: 'not a url' })).toEqual([
      'image_url',
    ]);
    expect(
      await errorsFor({ ...valid, image_url: '/products/x1-carbon.jpg' }),
    ).toEqual([]);
    expect(
      await errorsFor({ ...valid, image_url: 'javascript:alert(1)' }),
    ).toEqual(['image_url']);
    expect(await errorsFor({ ...valid, image_url: null })).toEqual([]);
  });
});
