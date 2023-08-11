import { Module } from '@nestjs/common';
import { TumblrModule } from './tumblr/tumblr.module';

@Module({
  imports: [TumblrModule],
})
export class V3AppModule {}
