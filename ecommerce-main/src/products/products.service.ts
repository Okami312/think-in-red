import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './product.entity/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Category } from './categories';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private productsRepository: Repository<ProductEntity>,
  ) {}

  // Soft-deleted rows are excluded automatically because of @DeleteDateColumn.
  findAll(category?: Category): Promise<ProductEntity[]> {
    return this.productsRepository.find({
      where: category ? { category } : {},
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ProductEntity> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  create(dto: CreateProductDto): Promise<ProductEntity> {
    const data = {
      ...dto,
      sold_from: dto.sold_from ?? null,
      sold_to: dto.sold_to ?? null,
      image_url: dto.image_url ?? null,
      specs: dto.specs ?? [],
      gallery: dto.gallery ?? [],
      featured: dto.featured ?? false,
    };
    this.assertValidSalePeriod(data.sold_from, data.sold_to);
    return this.productsRepository.save(this.productsRepository.create(data));
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductEntity> {
    const existing = await this.findOne(id);
    // undefined = keep current value, null = clear it.
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<ProductEntity>;
    this.assertValidSalePeriod(
      'sold_from' in changes ? changes.sold_from! : existing.sold_from,
      'sold_to' in changes ? changes.sold_to! : existing.sold_to,
    );
    if (Object.keys(changes).length > 0) {
      await this.productsRepository.update(id, changes);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  private assertValidSalePeriod(
    soldFrom: string | null | undefined,
    soldTo: string | null | undefined,
  ): void {
    if (soldFrom && soldTo && new Date(soldTo) < new Date(soldFrom)) {
      throw new BadRequestException('sold_to must not be before sold_from');
    }
  }
}
