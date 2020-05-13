import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { TumblrModule } from './tumblr/tumblr.module';
import { DeviantArtModule } from './deviant-art/deviant-art.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TumblrModule, DeviantArtModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
