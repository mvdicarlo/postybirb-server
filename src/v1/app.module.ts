import { Module } from '@nestjs/common';
import { MastodonModule } from './mastodon/mastodon.module';
import { TwitterModule } from './twitter/twitter.module';
import { DeviantArtModule } from './deviant-art/deviant-art.module';
import { TumblrModule } from './tumblr/tumblr.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  imports: [
    MastodonModule,
    TwitterModule,
    DeviantArtModule,
    TumblrModule,
  ],
})
export class V1AppModule {}
