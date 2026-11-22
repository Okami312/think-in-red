import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * An uploaded product photo, stored in Postgres so it survives on serverless
 * hosts (Vercel) that have no persistent disk. Products reference it by the
 * path `/images/<id>`.
 */
@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  mime_type: string;

  @Column({ type: 'int' })
  size: number;

  // Not selected by default, so listing/lookup queries stay light.
  @Column({ type: 'bytea', select: false })
  data: Buffer;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
