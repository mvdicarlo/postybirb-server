import { Controller, Post, Body, Get, HttpException } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { TwitterAuthDto, TwitterPostDto } from './twitter.interface';

@Controller('twitter')
export class TwitterController {
  constructor(private readonly service: TwitterService) {}

  @Post('v1/authorize')
  async authorizeClient(@Body() body: TwitterAuthDto): Promise<any> {
    if (!body) {
      throw new HttpException('No OAuth provided', 400);
    }

    if (!body.pin || !body.secret || !body.token) {
      throw new HttpException('Missing Oauth Params', 400);
    }

    return this.service.authorizePIN(body);
  }

  @Get('v1/authorize')
  async initAuthorization(): Promise<{ token: string, secret: string, url: string }> {
    return await this.service.createOAuth();
  }

  @Post('v1/post')
  async post(@Body() body: TwitterPostDto): Promise<any> {
    if (!body) {
      throw new HttpException('No data provided', 400);
    }

    if (!body.secret || !body.token) {
      throw new HttpException('No OAuth provided', 400);
    }

    if ((body.medias && body.medias.length) || body.status) {
      return await this.service.postStatus(body);
    } else {
      throw new HttpException('Incomplete post data. Must have medias and/or status', 400);
    }
  }
}
