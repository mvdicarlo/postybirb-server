import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '65mb' }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(compression());

  const limiter = rateLimit({
    max: 25,
    windowMs: 60_000 * 60
  });

  app.use(limiter);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
