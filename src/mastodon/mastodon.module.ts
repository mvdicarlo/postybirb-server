import { Module } from '@nestjs/common';
import { MastodonService } from './mastodon.service';
import { MastodonController } from './mastodon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MastodonInstanceSchema } from './mastodon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Mastodon',
        schema: MastodonInstanceSchema,
      },
    ]),
  ],
  providers: [MastodonService],
  controllers: [MastodonController],
})
export class MastodonModule {}
