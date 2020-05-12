import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { TumblrService } from './tumblr.service';
import { TumblrAuthorization } from './models/tumblr-authorization.model';
import { TumblrRefresh } from './models/tumblr-refresh.model';
import { SubmissionPost } from 'src/common/models/submission-post.model';
import { TumblrPostOptions } from './interfaces/tumblr-post.interface';

@Controller('tumblr')
export class TumblrController {
  constructor(private readonly service: TumblrService) {}

  @Get('v1/authorize')
  startAuthorization(@Query('port') port: number) {
    return this.service.startAuthorization(port);
  }

  @Post('v1/authorize')
  completeAuthorization(@Body() data: TumblrAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v1/refresh')
  checkToken(@Body() data: TumblrRefresh) {
    return this.service.refreshToken(data);
  }

  @Post('v1/post')
  post(@Body() data: SubmissionPost<TumblrPostOptions>) {
    return this.service.post(data);
  }
}
