import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** One row of a product's spec sheet, e.g. { label: 'RAM', value: '32 GB' }. */
export class SpecDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  value: string;
}
