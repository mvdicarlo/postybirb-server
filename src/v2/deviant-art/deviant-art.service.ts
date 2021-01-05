import { Injectable, Logger } from '@nestjs/common';
import { DeviantArtAuthorization } from './models/deviant-art-authorization.model';
import * as request from 'request';
import { ApiResponse } from 'src/v2/common/models/api-response.model';
import { DeviantArtRefresh } from './models/deviant-art-refresh.model';
import { DeviantArtAuthData } from './interfaces/deviant-art-auth-data.interface';

@Injectable()
export class DeviantArtService {
  private readonly logger: Logger = new Logger(DeviantArtService.name);

  private readonly CONFIG = {
    KEY: process.env.DEVIANT_ART_KEY,
    SECRET: process.env.DEVIANT_ART_SECRET,
    URI: {
      AUTHORIZE_URL: 'https://www.deviantart.com/oauth2/authorize?',
      ACCESS_URL: 'https://www.deviantart.com/oauth2/token',
      INFO_URL: '',
    },
  };

  private getRedirect(): string {
    return `http://localhost:4200/deviantart`; // 4200 hardcoded because DA auth sucks
  }

  private getUserInfoURL(token: string): string {
    return `https://www.deviantart.com/api/v1/oauth2/user/whoami?mature_content=true&access_token=${token}`;
  }

  startAuthorization(): string {
    return `${this.CONFIG.URI.AUTHORIZE_URL}response_type=code&client_id=${
      this.CONFIG.KEY
    }&redirect_uri=${this.getRedirect()}&scope=basic browse user.manage&state=0`;
  }

  completeAuthorization(
    data: DeviantArtAuthorization,
  ): Promise<ApiResponse<DeviantArtAuthData>> {
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
        (err, res, body: DeviantArtAuthData) => {
          if (err || body.status === 'error') {
            this.logger.error(err || body.error_description);
            reject(new ApiResponse({ error: err || body.error_description }));
          } else {
            request.get(
              this.getUserInfoURL(body.access_token),
              { json: true },
              (err, resp, info) => {
                if (err) {
                  this.logger.error(err);
                  reject(new ApiResponse({ error: err }));
                } else {
                  resolve(
                    new ApiResponse<DeviantArtAuthData>({
                      data: { ...body, username: info.username },
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

  refreshToken(
    data: DeviantArtRefresh,
  ): Promise<ApiResponse<DeviantArtAuthData>> {
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
        (err, res, body: DeviantArtAuthData) => {
          if (err || body.status === 'error') {
            reject(new ApiResponse({ error: err || body.error_description }));
          } else {
            request.get(
              this.getUserInfoURL(body.access_token),
              { json: true },
              (err, resp, info) => {
                if (err) {
                  this.logger.error(err);
                  reject(new ApiResponse({ error: err }));
                } else {
                  resolve(
                    new ApiResponse<DeviantArtAuthData>({
                      data: { ...body, username: info.username },
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
