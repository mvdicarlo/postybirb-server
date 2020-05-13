import { Controller, Get, Res, Post, Body } from '@nestjs/common';
import { DeviantArtService } from './deviant-art.service';
import { DeviantArtAuthorization } from './models/deviant-art-authorization.model';
import { DeviantArtRefresh } from './models/deviant-art-refresh.model';

@Controller('deviant-art')
export class DeviantArtController {
  private requestMap: Record<any, any> = {};

  constructor(private readonly service: DeviantArtService) {}

  @Get('v1/authorize')
  startAuthorization(@Res() res: any) {
    res.redirect(this.service.startAuthorization());
  }

  @Post('v1/authorize')
  completeAuthorization(@Body() data: DeviantArtAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v1/refresh')
  refresh(@Body() data: DeviantArtRefresh) {
    return this.service.refreshToken(data);
  }
}
