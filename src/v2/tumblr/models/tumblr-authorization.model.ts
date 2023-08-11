import { IsNotEmpty, IsString } from 'class-validator';

export class TumblrAuthorization {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  verifier: string;

  @IsNotEmpty()
  @IsString()
  secret: string;
}