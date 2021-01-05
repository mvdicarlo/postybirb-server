import { Injectable, Logger } from '@nestjs/common';
import * as request from 'requestretry';

@Injectable()
export class DeviantArtService {
  private readonly logger: Logger = new Logger(DeviantArtService.name);

  private readonly DEVIANT_ART: any = {
    key: process.env.DEVIANT_ART_KEY,
    secret: process.env.DEVIANT_ART_SECRET,
    redirect: 'http://localhost:4200/deviantart',
    config: {
      authorize: 'https://www.deviantart.com/oauth2/authorize?',
      accessToken: 'https://www.deviantart.com/oauth2/token',
    },
  };

  public createOAuth(): string {
    return `${this.DEVIANT_ART.config.authorize}response_type=code&client_id=${this.DEVIANT_ART.key}&redirect_uri=${this.DEVIANT_ART.redirect}&scope=basic browse user.manage&state=0`;
  }

  public async authorizeClient(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request.post('https://www.deviantart.com/oauth2/token', {
        form: {
          client_id: this.DEVIANT_ART.key,
          client_secret: this.DEVIANT_ART.secret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:4200/deviantart',
        },
      }, (err, response, body) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(body);
        }
      });
    });
  }

  public refresh(refreshToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request.post('https://www.deviantart.com/oauth2/token', {
        form: {
          grant_type: 'refresh_token',
          client_id: this.DEVIANT_ART.key,
          client_secret: this.DEVIANT_ART.secret,
          refresh_token: refreshToken,
        },
      }, (err, response, body) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(body);
        }
      });
    });
  }
}
