import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { DeviantArtModule } from './deviant-art/deviant-art.module';
import { MastodonModule } from './mastodon/mastodon.module';
import { TumblrModule } from './tumblr/tumblr.module';
import { TwitterModule } from './twitter/twitter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      `mongodb://postybirb:${process.env.DB_PASSWORD}@ds247648.mlab.com:47648/postybirb`,
      {
        useNewUrlParser: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 10000,
      },
    ),
    TumblrModule,
    DeviantArtModule,
    MastodonModule,
    TwitterModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
