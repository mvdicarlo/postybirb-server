import { Controller, Body, Post, Get, HttpException, Res } from '@nestjs/common';
import { DeviantArtService } from './deviant-art.service';
import { DeviantArtAuthDto } from './deviant-art.interface';

@Controller('deviant-art')
export class DeviantArtController {
  constructor(private readonly service: DeviantArtService) {}

  @Post('v1/authorize')
  async authorizeClient(@Body() body: DeviantArtAuthDto): Promise<any> {
    if (!body) {
      throw new HttpException('Auth code missing', 400);
    }

    if (!body.code) {
      throw new HttpException('Auth code missing', 400);
    }

    return await this.service.authorizeClient(body.code);
  }

  @Get('v1/authorize')
  async initAuthorization(@Res() res: any): Promise<any> {
    res.redirect(this.service.createOAuth());
  }

  @Post('v1/refresh')
  async refresh(@Body() body: { refresh_token: string }): Promise<any> {
    if (!body) {
      throw new HttpException('Empty body', 400);
    }

    if (!body.refresh_token) {
      throw new HttpException('No refresh token', 400);
    }

    return await this.service.refresh(body.refresh_token);
  }
}
