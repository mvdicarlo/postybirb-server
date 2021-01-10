import { Controller, Post, Get, Body, HttpException } from '@nestjs/common';
import { TumblrService } from './tumblr.service';
import { TumblrAuthDto, TumblrPostDto } from './tumblr.interface';

@Controller('tumblr')
export class TumblrController {
  constructor(private readonly service: TumblrService) {}

  @Post('v1/authorize')
  async authorizeClient(@Body() body: TumblrAuthDto): Promise<any> {
    if (!body) {
      throw new HttpException('OAuth code missing', 400);
    }

    if (!body.oauth_token || !body.oauth_verifier || !body.secret) {
      throw new HttpException('OAuth Params missing', 400);
    }

    return await this.service.authorizeClient(body);
  }

  @Get('v1/authorize')
  async initAuthorization(): Promise<any> {
    return await this.service.createOAuth();
  }

  @Post('v1/refresh')
  async refresh(@Body() body: { token: string, secret: string }): Promise<any> {
    if (!body) {
      throw new HttpException('Auth code missing', 400);
    }

    if (!body.token || !body.secret) {
      throw new HttpException('Missing token and secret', 400);
    }

    return await this.service.refresh(body.token, body.secret);
  }

  @Post('v1/post')
  async post(@Body() body: TumblrPostDto): Promise<any> {
    if (!body) {
      throw new HttpException('No post body', 400);
    }

    // TODO better validation here
    return await this.service.post(body);
  }
}
