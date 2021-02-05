import { Module } from '@nestjs/common';
import { MastodonController } from './mastodon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MastodonInstanceSchema } from 'src/v2/mastodon/mastodon.schema';
import { MastodonService } from './mastodon.service';

@Module({
  controllers: [MastodonController],
  providers: [MastodonService],
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Mastodon',
        schema: MastodonInstanceSchema
      }
    ])
  ]
})
export class MastodonModule {}
