import { Module } from '@nestjs/common';
import { DeviantArtService } from './deviant-art.service';
import { DeviantArtController } from './deviant-art.controller';

@Module({
  providers: [DeviantArtService],
  controllers: [DeviantArtController]
})
export class DeviantArtModule {}
