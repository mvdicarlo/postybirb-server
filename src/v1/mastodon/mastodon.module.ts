import { Module } from '@nestjs/common';
import { MastodonController } from './mastodon.controller';
import { MastodonService } from './mastodon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MastodonSchema } from './mastodon.models';

@Module({
  controllers: [MastodonController],
  providers: [MastodonService],
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Mastodon',
        schema: MastodonSchema
      }
    ])
  ]
})
export class MastodonModule {}
