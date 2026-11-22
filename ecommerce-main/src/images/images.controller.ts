import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesService } from './images.service';
import { MAX_IMAGE_BYTES } from './image-type';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /** Multipart upload, one file in the "file" field. Admins only. */
  @Post()
  @UseGuards(JwtAuthGuard)
  // Multer rejects larger files with 413 before they're buffered in memory.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File): Promise<{ url: string }> {
    return this.imagesService.upload(file?.buffer);
  }

  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const image = await this.imagesService.findOne(id);
    res
      .set({
        'Content-Type': image.mime_type,
        'Content-Length': String(image.size),
        // An image ID never points at different bytes, so cache it forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        // Product pages on the frontend's origin embed these images.
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })
      .send(image.data);
  }
}
