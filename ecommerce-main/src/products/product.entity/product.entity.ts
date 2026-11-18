import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ValueTransformer,
} from 'typeorm';

// Postgres returns DECIMAL as a string to avoid precision loss; prices fit
// comfortably in a JS number, so expose them as numbers to API clients.
const decimalToNumber: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? value : parseFloat(value)),
};

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** One of CATEGORIES (validated in the DTOs). */
  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalToNumber,
  })
  price: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'int' })
  available_quantity: number;

  // DATE columns come back from Postgres as 'YYYY-MM-DD' strings. Keeping them
  // as strings avoids timezone shifts from converting through JS Date.
  @Column({ type: 'date', nullable: true })
  sold_from: string | null;

  @Column({ type: 'date', nullable: true })
  sold_to: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  image_url: string | null;

  /** Extra images for the product page gallery (URLs or /products/… paths). */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  gallery: string[];

  /** Ordered spec sheet rows, e.g. [{ label: 'CPU', value: 'Core Ultra 7' }]. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  specs: { label: string; value: string }[];

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @DeleteDateColumn({ select: false })
  deleted_at: Date | null;
}
