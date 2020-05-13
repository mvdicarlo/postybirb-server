import { IsDefined, IsString } from 'class-validator';

export class DeviantArtRefresh {
  @IsDefined()
  @IsString()
  readonly token: string;
}
