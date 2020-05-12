import { Module } from '@nestjs/common';
import { TumblrService } from './tumblr.service';
import { TumblrController } from './tumblr.controller';

@Module({
  providers: [TumblrService],
  controllers: [TumblrController]
})
export class TumblrModule {}
