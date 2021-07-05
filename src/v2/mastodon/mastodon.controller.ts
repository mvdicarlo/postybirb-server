import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiResponse } from 'src/v2/common/models/api-response.model';
import validator from 'validator';
import { MastodonService } from './mastodon.service';
import { MastodonAuthorization } from './models/mastodon-authorization.model';

@Controller('mastodon')
export class MastodonController {
  constructor(private readonly service: MastodonService) {}

  @Get('v2/authorize/*')
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
    return this.startAuthorization(params, website, res);
  }

  @Get('v2/authorize/:website?')
  async startAuthorization(@Param() params: any, @Query('website') website: string, @Res() res: any) {
    website = website || params.website;
    if (!website) {
      throw new ApiResponse<any>({ error: 'No website URL provided' });
    }

    website = this.sanitize(website);
    if (!validator.isURL(website)) {
      throw new ApiResponse<any>({ error: 'Invalid website URL provided' });
    }

    res.redirect(await this.service.startAuthorization(website));
  }

  @Post('v2/authorize')
  completeAuthorization(@Body() data: MastodonAuthorization) {
    data.website = this.sanitize(data.website);
    return this.service.completeAuthorization(data);
  }

  private sanitize(website: string): string {
    return new URL(
      website
        .toLowerCase()
        .trim()
        .replace(/\s/, '')
        .replace(/\/$/, ''),
    ).origin;
  }
}
