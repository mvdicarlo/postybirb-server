import { Controller, Post, Body, Param, Get, Res, HttpException } from '@nestjs/common';
import validator from 'validator';
import { MastodonAuthDto } from './mastodon.interface';
import { MastodonService } from './mastodon.service';

@Controller('mastodon')
export class MastodonController {
  constructor(private readonly service: MastodonService) {}

  @Post('v1/authorize/:website?')
  async authorize(@Body() body: MastodonAuthDto, @Param() params: any): Promise<any> {
    if (!params.website) {
      throw new HttpException('Must provide website url', 400);
    }

    const website = params.website.toLowerCase().trim();
    if (!validator.isURL(website)) {
      throw new HttpException(`Invalid URL provided: ${website}`, 400);
    }

    if (!body.code) {
      throw new HttpException(`Must provide a code`, 400);
    }

    return await this.service.authorizeClient(website, body.code);
  }

  @Get('v1/authorize/:website?')
  async generateAuthRedirect(@Param() params: any, @Res() res: any): Promise<any> {
    if (!params.website) {
      throw new HttpException('Must provide website url', 400);
    }

    const website = params.website.toLowerCase().trim();
    if (!validator.isURL(website)) {
      throw new HttpException(`Invalid URL provided: ${website}`, 400);
    }

    try {
      res.redirect(await this.service.generateAuthRedirect(website));
    } catch (err) {
      throw err;
    }
  }
}
