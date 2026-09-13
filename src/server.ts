import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || DEFAULT_PORT;

  await application.listen(port);
  Logger.log(`MedClinic API em execucao na porta ${port}`, 'Bootstrap');
}

void bootstrap();
