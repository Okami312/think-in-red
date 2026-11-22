import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { ImageEntity } from './image.entity';
import { MAX_IMAGE_BYTES } from './image-type';
import { ImagesService } from './images.service';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe('ImagesService', () => {
  const repo = {
    create: jest.fn((data: Partial<ImageEntity>) => data),
    save: jest.fn((img: Partial<ImageEntity>) =>
      Promise.resolve({ ...img, id: 'uuid-1' }),
    ),
    findOne: jest.fn(),
  };
  const service = new ImagesService(repo as unknown as Repository<ImageEntity>);
  beforeEach(() => jest.clearAllMocks());

  it('stores the bytes with their detected type and size', async () => {
    const png = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(8)]);
    await expect(service.upload(png)).resolves.toEqual({
      url: '/images/uuid-1',
    });
    expect(repo.create).toHaveBeenCalledWith({
      data: png,
      mime_type: 'image/png',
      size: 16,
    });
  });

  // The HTTP layer already caps uploads; this guards other callers.
  it('rejects images over the size limit', async () => {
    const big = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(MAX_IMAGE_BYTES)]);
    await expect(service.upload(big)).rejects.toThrow(PayloadTooLargeException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects a missing or empty upload', async () => {
    await expect(service.upload(undefined)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.upload(Buffer.alloc(0))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('does not query the database for IDs that are not UUIDs', async () => {
    await expect(service.findOne("1' OR 1=1")).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });
});
