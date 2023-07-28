import { Controller, Post, Get, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { TumblrService } from './tumblr.service';
import { TumblrAuthorization } from './models/tumblr-authorization.model';
import { TumblrRefresh } from './models/tumblr-refresh.model';
import { SubmissionPost } from 'src/v2/common/models/submission-post.model';
import { TumblrPostOptions } from './interfaces/tumblr-post.interface';

@Controller('tumblr')
export class TumblrController {
  constructor(private readonly service: TumblrService) {}

  @Get('v2/authorize')
  startAuthorization(@Res() res: any, @Query('port') port: string) {
    res.redirect(this.service.startAuthorization(port));
  }

  @Post('v2/authorize')
  completeAuthorization(@Body() data: TumblrAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v2/refresh')
  refresh(@Body() data: TumblrRefresh) {
    return this.service.refreshToken(data);
  }

  // @Post('v2/post')
  // post(@Body() data: SubmissionPost<TumblrPostOptions>) {
  //   return this.service.post(data);
  // }
}
