import { IsIn, IsOptional } from 'class-validator';
import { CATEGORIES, type Category } from '../categories';

export class ListProductsQueryDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;
}
