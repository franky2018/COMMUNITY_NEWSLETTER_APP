import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const bodyLimit = process.env.BODY_LIMIT ?? '1mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => !isProduction || origin.startsWith('https://'));
  if (corsOrigins && corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
