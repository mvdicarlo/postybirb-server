import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { TumblrAuthorization } from './models/tumblr-authorization.model';
import { TumblrRefresh } from './models/tumblr-refresh.model';
import { TumblrService } from './tumblr.service';

@Controller('tumblr')
export class TumblrController {
  constructor(private readonly service: TumblrService) {}

  @Get('v3/authorize')
  startAuthorization(@Res() res: any, @Query('port') port: string) {
    res.redirect(this.service.startAuthorization(port));
  }

  @Post('v3/authorize')
  completeAuthorization(@Body() data: TumblrAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v3/refresh')
  refresh(@Body() data: TumblrRefresh) {
    return this.service.refreshToken(data);
  }
}
