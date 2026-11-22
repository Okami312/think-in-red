import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ImageEntity } from './image.entity';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [TypeOrmModule.forFeature([ImageEntity]), AuthModule],
  providers: [ImagesService],
  controllers: [ImagesController],
})
export class ImagesModule {}
