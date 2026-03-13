import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FSRS Scheduling Service')
    .setDescription('Spaced-repetition scheduling, tracking, and review API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'user-id')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.FSRS_SERVICE_PORT || 3334;
  await app.listen(port);
  Logger.log(
    `🚀 FSRS Service running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📖 Swagger docs at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
