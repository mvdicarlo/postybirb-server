import { IsNotEmpty, IsString } from 'class-validator';

export class TumblrRefresh {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  secret: string;
}