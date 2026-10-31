import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { requireIntegerEnvironmentVariable } from './utils/environment.util';

const API_PREFIX = '/api/v1';
const LISTEN_ADDRESS = '0.0.0.0';

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create(AppModule);
  const port = requireIntegerEnvironmentVariable('PORT');

  application.setGlobalPrefix(API_PREFIX);
  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  application.useGlobalFilters(new AllExceptionsFilter());

  await application.listen(port, LISTEN_ADDRESS);
  Logger.log(`MedClinic API running on port ${port}`, 'Bootstrap');
}

void bootstrap();
