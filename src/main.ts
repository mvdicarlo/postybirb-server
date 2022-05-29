import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(bodyParser.json({ limit: '65mb' }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(compression());

  app.set('trust proxy', 1);
  const limiter = rateLimit({
    max: 60,
    windowMs: 5 * 60_000
  });

  app.use(limiter);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
