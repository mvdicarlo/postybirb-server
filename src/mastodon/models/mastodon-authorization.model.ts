import { IsString, IsDefined, IsUrl } from 'class-validator';

export class MastodonAuthorization {
  @IsString()
  @IsDefined()
  @IsUrl()
  website: string;

  @IsString()
  @IsDefined()
  readonly code: string;
}
