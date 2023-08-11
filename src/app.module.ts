import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { V1AppModule } from './v1/app.module';
import { V2AppModule } from './v2/app.module';
import { V3AppModule } from './V3/app.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 10000,
    }),
    V1AppModule,
    V2AppModule,
    V3AppModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
