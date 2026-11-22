import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SpecDto } from './spec.dto';
import { UpdateProductDto } from './update-product.dto';

async function errorsFor(body: object) {
  const errors = await validate(plainToInstance(UpdateProductDto, body));
  return errors.map((e) => e.property);
}

describe('UpdateProductDto', () => {
  it('accepts an empty update (every field is optional)', async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it('accepts null to clear the image and sale dates', async () => {
    expect(
      await errorsFor({ image_url: null, sold_from: null, sold_to: null }),
    ).toEqual([]);
  });

  it('turns spec rows into SpecDto instances and validates each one', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      specs: [{ label: 'RAM', value: '16 GB' }],
    });
    expect(dto.specs?.[0]).toBeInstanceOf(SpecDto);
    expect(
      await errorsFor({ specs: [{ label: 'RAM', value: '16 GB' }] }),
    ).toEqual([]);
    expect(await errorsFor({ specs: [{ label: '', value: 1 }] })).toEqual([
      'specs',
    ]);
  });

  it('still rejects invalid values for fields that are sent', async () => {
    expect(
      await errorsFor({
        name: '',
        price: -1,
        category: 'phones',
        gallery: ['javascript:alert(1)'],
      }),
    ).toEqual(['name', 'category', 'price', 'gallery']);
  });

  it('limits the gallery to 9 photos (plus the cover = 10)', async () => {
    const gallery = (n: number) =>
      Array.from({ length: n }, (_, i) => `/images/${i}`);
    expect(await errorsFor({ gallery: gallery(9) })).toEqual([]);
    expect(await errorsFor({ gallery: gallery(10) })).toEqual(['gallery']);
  });
});
