import { Injectable, Logger } from '@nestjs/common';
import * as request from 'request';
import { ApiResponse } from 'src/v2/common/models/api-response.model';
import { TumblrAuthData } from './interfaces/tumblr-user-data.interface';
import { TumblrAuthorization } from './models/tumblr-authorization.model';
import { TumblrRefresh } from './models/tumblr-refresh.model';

@Injectable()
export class TumblrService {
  private readonly logger: Logger = new Logger(TumblrService.name);

  private readonly CONFIG = {
    KEY: process.env.TUMBLR_KEY,
    SECRET: process.env.TUMBLR_SECRET,
    URI: {
      AUTHORIZE_URL: 'https://www.tumblr.com/oauth2/authorize?',
      ACCESS_URL: 'https://api.tumblr.com/v2/oauth2/token',
      INFO_URL: '',
    },
  };

  private getRedirect(port?: string): string {
    return `http://localhost:4200/tumblr`;
  }

  private getUserInfoURL(): string {
    return `https://api.tumblr.com/v2/user/info`;
  }

  startAuthorization(port?: string): string {
    return `${this.CONFIG.URI.AUTHORIZE_URL}response_type=code&client_id=${
      this.CONFIG.KEY
    }&redirect_uri=${this.getRedirect(port)}&scope=basic write&state=auth`;
  }

  completeAuthorization(
    data: TumblrAuthorization,
  ): Promise<ApiResponse<TumblrAuthData>> {
    return new Promise((resolve, reject) => {
      request.post(
        this.CONFIG.URI.ACCESS_URL,
        {
          form: {
            client_id: this.CONFIG.KEY,
            client_secret: this.CONFIG.SECRET,
            grant_type: 'authorization_code',
            code: data.code,
            redirect_uri: this.getRedirect(),
          },
          json: true,
        },
        (err, res, body: TumblrAuthData) => {
          console.log(err, body);
          if (err || body.status === 'error') {
            this.logger.error(err || body.error_description);
            reject(new ApiResponse({ error: err || body.error_description }));
          } else {
            request.get(
              this.getUserInfoURL(),
              {
                json: true,
                headers: {
                  Authorization: `Bearer ${body.access_token}`,
                },
              },
              (err, resp, info) => {
                console.log(err, info);
                if (err || info.errors?.length) {
                  this.logger.error(err || info);
                  reject(new ApiResponse({ error: err || info }));
                } else {
                  resolve(
                    new ApiResponse<TumblrAuthData>({
                      data: {
                        ...body,
                        user: {
                          name: info.response.user.name,
                          blogs: info.response.user.blogs,
                        },
                      },
                    }),
                  );
                }
              },
            );
          }
        },
      );
    });
  }

  refreshToken(data: TumblrRefresh): Promise<ApiResponse<TumblrAuthData>> {
    return new Promise((resolve, reject) => {
      request.post(
        this.CONFIG.URI.ACCESS_URL,
        {
          form: {
            grant_type: 'refresh_token',
            client_id: this.CONFIG.KEY,
            client_secret: this.CONFIG.SECRET,
            refresh_token: data.token,
          },
          json: true,
        },
        (err, res, body: TumblrAuthData) => {
          if (err || body.status === 'error') {
            reject(new ApiResponse({ error: err || body.error_description }));
          } else {
            request.get(
              this.getUserInfoURL(),
              {
                json: true,
                headers: {
                  Authorization: `Bearer ${body.access_token}`,
                },
              },
              (err, resp, info) => {
                console.log(err, info);
                if (err || info.errors?.length) {
                  this.logger.error(err || info);
                  reject(new ApiResponse({ error: err || info }));
                } else {
                  resolve(
                    new ApiResponse<TumblrAuthData>({
                      data: {
                        ...body,
                        user: {
                          name: info.response.user.name,
                          blogs: info.response.user.blogs,
                        },
                      },
                    }),
                  );
                }
              },
            );
          }
        },
      );
    });
  }
}
