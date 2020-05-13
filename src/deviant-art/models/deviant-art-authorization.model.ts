import { IsString, IsDefined } from 'class-validator';

export class DeviantArtAuthorization {
  @IsString()
  @IsDefined()
  readonly code: string;
}
