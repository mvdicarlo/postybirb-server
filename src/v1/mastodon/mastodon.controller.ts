import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Res,
  HttpException,
  Query,
} from '@nestjs/common';
import validator from 'validator';
import { MastodonAuthDto } from './mastodon.interface';
import { MastodonService } from './mastodon.service';

@Controller('mastodon')
export class MastodonController {
  constructor(private readonly service: MastodonService) {}

  @Post('v1/authorize/*')
  async catchAuthorizePost(
    @Body() body: MastodonAuthDto,
    @Param() params: any,
    @Query('website') website: string,
  ) {
    if (
      params[0] &&
      params[0].startsWith('https:/') &&
      !params[0].startsWith('https://')
    ) {
      website = params[0].replace('https:/', 'https://');
    } else {
      website = website ? website : params[0];
    }
    return this.authorize(body, params, website);
  }

  @Post('v1/authorize/:website?')
  async authorize(
    @Body() body: MastodonAuthDto,
    @Param() params: any,
    @Query('website') website: string,
  ): Promise<any> {
    website = website || params.website;
    if (!website) {
      throw new HttpException('Must provide website url', 400);
    }

    website = website.toLowerCase().trim();
    if (!validator.isURL(website)) {
      throw new HttpException(`Invalid URL provided: ${website}`, 400);
    }

    if (!body.code) {
      throw new HttpException(`Must provide a code`, 400);
    }

    return await this.service.authorizeClient(website, body.code);
  }

  @Get('v1/authorize/*')
  async catchAuthorize(
    @Param() params: any,
    @Query('website') website: string,
    @Res() res: any,
  ) {
    if (
      params[0] &&
      params[0].startsWith('https:/') &&
      !params[0].startsWith('https://')
    ) {
      website = params[0].replace('https:/', 'https://');
    } else {
      website = website ? website : params[0];
    }
    return this.generateAuthRedirect(params, website, res);
  }

  @Get('v1/authorize/:website?')
  async generateAuthRedirect(
    @Param() params: any,
    @Query('website') website: string,
    @Res() res: any,
  ): Promise<any> {
    website = website || params.website;
    if (!website) {
      throw new HttpException('Must provide website url', 400);
    }

    website = website.toLowerCase().trim();
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
