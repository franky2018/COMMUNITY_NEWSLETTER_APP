import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';

@Module({
  imports: [MailModule, SubscribersModule],
  controllers: [NewslettersController],
  providers: [NewslettersService],
  exports: [NewslettersService],
})
export class NewslettersModule {}
