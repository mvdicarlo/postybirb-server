import { Module } from '@nestjs/common';
import { TumblrController } from './tumblr.controller';
import { TumblrService } from './tumblr.service';

@Module({
  controllers: [TumblrController],
  providers: [TumblrService]
})
export class TumblrModule {}
