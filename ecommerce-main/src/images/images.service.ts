import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageEntity } from './image.entity';
import { detectImageType, MAX_IMAGE_BYTES } from './image-type';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ImageEntity)
    private imagesRepository: Repository<ImageEntity>,
  ) {}

  /** Stores the image and returns the path products should reference. */
  async upload(data: Buffer | undefined): Promise<{ url: string }> {
    if (!data || data.length === 0) {
      throw new BadRequestException('Attach an image in the "file" field');
    }
    if (data.length > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException('Images must be 4 MB or smaller');
    }
    const mime_type = detectImageType(data);
    if (!mime_type) {
      throw new BadRequestException(
        'Unsupported image. Use JPEG, PNG, WebP, GIF or AVIF',
      );
    }
    const saved = await this.imagesRepository.save(
      this.imagesRepository.create({ data, mime_type, size: data.length }),
    );
    return { url: `/images/${saved.id}` };
  }

  async findOne(id: string): Promise<ImageEntity> {
    const image = UUID.test(id)
      ? await this.imagesRepository.findOne({
          where: { id },
          select: { id: true, mime_type: true, size: true, data: true },
        })
      : null;
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }
}
