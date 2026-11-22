import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CATEGORIES, type Category } from '../categories';
import { SpecDto } from './spec.dto';
import { MAX_GALLERY } from '../photos';

// Every field is optional; omitted fields are left unchanged.
// sold_from / sold_to / image_url may be sent as null to clear them.
export class UpdateProductDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(CATEGORIES, {
    message: `category must be one of: ${CATEGORIES.join(', ')}`,
  })
  category?: Category;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  available_quantity?: number;

  @IsOptional()
  @IsDateString()
  sold_from?: string | null;

  @IsOptional()
  @IsDateString()
  sold_to?: string | null;

  @IsOptional()
  @Matches(/^(https?:\/\/\S+|\/\S*)$/i, {
    message:
      'image_url must be an http(s) URL or a site path like /products/x.jpg',
  })
  @MaxLength(2048)
  image_url?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_GALLERY, {
    message: `a product can have at most ${MAX_GALLERY + 1} photos (cover + ${MAX_GALLERY} gallery)`,
  })
  @Matches(/^(https?:\/\/\S+|\/\S*)$/i, {
    each: true,
    message:
      'each gallery entry must be an http(s) URL or a site path like /products/x.jpg',
  })
  @MaxLength(2048, { each: true })
  gallery?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SpecDto)
  specs?: SpecDto[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
