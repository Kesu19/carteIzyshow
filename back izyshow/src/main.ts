import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ajoutez le middleware CORS global
  app.use(cors());

  await app.listen(4000);
}
bootstrap();