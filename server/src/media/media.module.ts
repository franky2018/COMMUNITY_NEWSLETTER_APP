import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [CloudinaryService, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
