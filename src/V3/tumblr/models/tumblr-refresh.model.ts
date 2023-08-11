import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class TumblrRefresh {
  @IsDefined()
  @IsString()
  readonly token: string;
}
