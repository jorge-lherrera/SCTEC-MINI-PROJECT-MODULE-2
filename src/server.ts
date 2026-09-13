import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || DEFAULT_PORT;

  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await application.listen(port);
  Logger.log(`MedClinic API running on port ${port}`, 'Bootstrap');
}

void bootstrap();
