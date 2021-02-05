import { Module } from '@nestjs/common';
import { DeviantArtController } from './deviant-art.controller';
import { DeviantArtService } from './deviant-art.service';

@Module({
  controllers: [DeviantArtController],
  providers: [DeviantArtService]
})
export class DeviantArtModule {}
