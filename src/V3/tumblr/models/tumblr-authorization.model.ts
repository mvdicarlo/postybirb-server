import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class TumblrAuthorization {
  @IsString()
  @IsDefined()
  readonly code: string;
}
