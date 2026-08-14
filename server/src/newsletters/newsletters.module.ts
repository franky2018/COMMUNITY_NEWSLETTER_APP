import { Module } from '@nestjs/common';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';

@Module({
  controllers: [NewslettersController],
  providers: [NewslettersService],
  exports: [NewslettersService],
})
export class NewslettersModule {}
