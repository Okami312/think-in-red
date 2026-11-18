import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductEntity } from './product.entity/product.entity';

const baseProduct = {
  name: 'iPhone 17',
  category: 'laptops' as const,
  description: 'A phone',
  price: 2299.99,
  currency: 'USD',
  available_quantity: 200,
};

describe('ProductsService', () => {
  let service: ProductsService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: object) => data),
    save: jest.fn((data: object) => Promise.resolve({ id: 1, ...data })),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(ProductEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('throws NotFound for a missing product', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('stores missing or null sale dates as null', async () => {
    await service.create({ ...baseProduct, sold_from: null });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sold_from: null,
        sold_to: null,
        image_url: null,
        specs: [],
        featured: false,
      }),
    );
  });

  it('rejects sold_to before sold_from on create', () => {
    expect(() =>
      service.create({
        ...baseProduct,
        sold_from: '2026-05-10',
        sold_to: '2026-05-01',
      }),
    ).toThrow(BadRequestException);
  });

  it('only updates fields that were sent, and allows clearing dates', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      ...baseProduct,
      sold_from: '2026-01-01',
      sold_to: null,
    });
    await service.update(1, { price: 10, sold_from: null, name: undefined });
    expect(repo.update).toHaveBeenCalledWith(1, {
      price: 10,
      sold_from: null,
    });
  });

  it('checks the sale period against existing values on update', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      ...baseProduct,
      sold_from: '2026-06-01',
      sold_to: null,
    });
    await expect(service.update(1, { sold_to: '2026-05-01' })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('filters by category when one is given', async () => {
    repo.find.mockResolvedValue([]);
    await service.findAll('mice');
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'mice' } }),
    );
    await service.findAll();
    expect(repo.find).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('throws NotFound when deleting a missing product', async () => {
    repo.softDelete.mockResolvedValue({ affected: 0 });
    await expect(service.remove(99)).rejects.toThrow(NotFoundException);
  });
});
