import { Injectable, Logger } from '@nestjs/common';
import { OAuth } from 'oauth';
import * as JSON from 'circular-json';
import * as request from 'request';
import * as tumblr from 'tumblr.js';
import { TumblrAuthDto, TumblrPostDto } from './tumblr.interface';

/**
* Just as a general note, a lot of this code here is from the old legacy repo
* Tumblr.js is kind of bad in my opinion and I should one day refactor my code to avoid using it
**/

export interface TumblrUserData {
  accessSecret?: any;
  accessToken?: any;
  user: {
    name: string;
    blogs: any;
  }
}

@Injectable()
export class TumblrService {
  private readonly logger: Logger = new Logger(TumblrService.name);

  private readonly TUMBLR: any = {
    key: process.env.TUMBLR_KEY,
    secret: process.env.TUMBLR_SECRET,
    config: {
      tumblrRequestTokenUrl: 'https://www.tumblr.com/oauth/request_token',
      tumblrAuthorizeUrl: 'https://www.tumblr.com/oauth/authorize',
      tumblrAccessTokenUrl: 'https://www.tumblr.com/oauth/access_token',
      callbackAutoUri: 'tumblr-auth',
    },
  };

  private getTumblrOAuth(): any {
    return new OAuth(
      this.TUMBLR.config.tumblrRequestTokenUrl,
      this.TUMBLR.config.tumblrAccessTokenUrl,
      this.TUMBLR.key, this.TUMBLR.secret,
      '1.0A',
      'http://localhost:4200/tumblr',
      'HMAC-SHA1'
    );
  }

  public createOAuth(): Promise<any> {
    const clientAuth = this.getTumblrOAuth();
    return new Promise((resolve, reject) => {
      clientAuth.getOAuthRequestToken((err, token, secret, parsedQueryString) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve({
            token,
            secret,
            url: `${this.TUMBLR.config.tumblrAuthorizeUrl}?oauth_token=${token}`,
          });
        }
      });
    });
  }

  public authorizeClient(oauth: TumblrAuthDto): Promise<TumblrUserData> {
    const clientAuth = this.getTumblrOAuth();
    return new Promise((resolve, reject) => {
      clientAuth.getOAuthAccessToken(oauth.oauth_token, oauth.secret, oauth.oauth_verifier,
        (err, accessToken, accessSecret, resp) => {
          if (err) {
            this.logger.error(err);
            reject(err);
            return;
          }

          const client = tumblr.createClient({
            consumer_key: this.TUMBLR.key,
            consumer_secret: this.TUMBLR.secret,
            token: accessToken,
            token_secret: accessSecret,
          });

          client.userInfo((err, data) => {
            if (err) {
              this.logger.error(err);
              reject(err);
            } else {
              resolve({
                accessToken,
                accessSecret,
                user: {
                  name: data.user.name,
                  blogs: data.user.blogs,
                },
              });
            }
          });
        });
    });
  }

  public refresh(token: string, secret: string): Promise<TumblrUserData> {
    const client = tumblr.createClient({
      consumer_key: this.TUMBLR.key,
      consumer_secret: this.TUMBLR.secret,
      token,
      token_secret: secret,
    });

    return new Promise((resolve, reject) => {
      client.userInfo((err, data) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve({
            user: {
              name: data.user.name,
              blogs: data.user.blogs
            }
          });
        }
      });
    });
  }

  public async post(postData: TumblrPostDto): Promise<any> {
    const formData: any = {
      type: postData.type,
      tags: postData.tags || '',
    };

    postData.medias = postData.medias || [];
    const { type, medias } = postData;
    if (type === 'photo') {
      formData.caption = postData.description;
      for (let i = 0; i < medias.length; i++) {
        formData[`data[${i}]`] = {
          value: Buffer.from(medias[i].base64, 'base64'),
          options: {
            filename: medias[i].fileInfo.name,
            contentType: medias[i].fileInfo.type,
          },
        };
      }
    } else if (type === 'text') {
      formData.title = postData.title || '';
      formData.body = postData.description;
    } else if (type === 'audio' && medias.length > 0) {
      formData.caption = postData.description;
      formData.data = {
        value: Buffer.from(medias[0].base64, 'base64'),
        options: {
          filename: medias[0].fileInfo.name,
          contentType: medias[0].fileInfo.type,
        },
      };
    } else if (type === 'video' && medias.length > 0) {
      formData.caption = postData.description;
      formData.data = {
        value: Buffer.from(medias[0].base64, 'base64'),
        options: {
          filename: medias[0].fileInfo.name,
          contentType: medias[0].fileInfo.type,
        },
      };
    }

    const oauth = {
      consumer_key: this.TUMBLR.key,
      consumer_secret: this.TUMBLR.secret,
      token: postData.token,
      token_secret: postData.secret,
    };

    return new Promise((resolve, reject) => {
      request.post({
        url: `https://api.tumblr.com/v2/blog/${postData.blog}/post`,
        oauth,
        formData,
      }, (err, resp, body) => {
        let json: any = {};
        try {
          json = JSON.parse(body);
        } catch (e) {
          this.logger.error('Unable to parse body from tumblr post');
          this.logger.error(body);
          this.logger.error(err);
          reject(body);
          return;
        }

        if (err || json.errors) {
          // trying to find the failure
          this.logger.error(json.errors);
          try {
            if (medias && medias.length === 1) {
              formData.data.value = formData.data.value.length;
            } else {
              for (let i = 0; i < medias.length; i++) {
                formData[`data[${i}]`].value = formData[`data[${i}]`].value.length;
              }
            }
          } catch (e) {
            this.logger.error('Some unknown issue occurred');
            console.log(e);
          }

          reject((json.errors || []).map(error => `${error.title} - ${error.detail}`).join(', '));
        } else {
          resolve();
        }
      });
    });
  }
}
