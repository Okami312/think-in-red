import { getMetadataArgsStorage, ValueTransformer } from 'typeorm';
import { ProductEntity } from './product.entity';

const column = (name: keyof ProductEntity) => {
  const col = getMetadataArgsStorage().columns.find(
    (c) => c.target === ProductEntity && c.propertyName === name,
  );
  if (!col) throw new Error(`no column ${name}`);
  return col.options;
};

describe('ProductEntity', () => {
  describe('price transformer', () => {
    const t = column('price').transformer as ValueTransformer;

    it('turns the DECIMAL string Postgres returns into a number', () => {
      expect(t.from('1299.99')).toBe(1299.99);
      expect(t.from('0.00')).toBe(0);
    });

    it('passes null and undefined through, and writes numbers as-is', () => {
      expect(t.from(null)).toBeNull();
      expect(t.from(undefined)).toBeUndefined();
      expect(t.to(19.5)).toBe(19.5);
    });
  });

  it('defaults gallery and specs to empty JSON arrays in the database', () => {
    for (const name of ['gallery', 'specs'] as const) {
      const def = column(name).default as () => string;
      expect(def()).toBe("'[]'::jsonb");
    }
  });
});
