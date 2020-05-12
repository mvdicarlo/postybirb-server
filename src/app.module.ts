import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { TumblrModule } from './tumblr/tumblr.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TumblrModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
