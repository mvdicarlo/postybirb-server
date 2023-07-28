import { Injectable, Logger } from '@nestjs/common';
import { OAuth } from 'oauth';
import * as request from 'request';
import {
  FileSubmissionType,
  getSubmissionType,
} from 'src/v2/common/enums/file-submission-type.enum';
import { ApiResponse } from 'src/v2/common/models/api-response.model';
import { SubmissionPost } from 'src/v2/common/models/submission-post.model';
import * as Tumblr from 'tumblr.js';
import { TumblrOAuthData } from './interfaces/tumblr-oauth-data.interface';
import { TumblrPostOptions } from './interfaces/tumblr-post.interface';
import {
  TumblrAccountData,
  TumblrAuthData,
} from './interfaces/tumblr-user-data.interface';
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

  // private getOAuth(port?: number) {
  //   return new OAuth(
  //     this.CONFIG.URI.REQUEST_URL,
  //     this.CONFIG.URI.ACCESS_URL,
  //     this.CONFIG.KEY,
  //     this.CONFIG.SECRET,
  //     '1.0A',
  //     `http://localhost:${port || 4200}/tumblr`,
  //     'HMAC-SHA1',
  //   );
  // }

  // startAuthorization(port?: number): Promise<ApiResponse<TumblrOAuthData>> {
  //   const auth = this.getOAuth(port);
  //   auth.authHeader;
  //   return new Promise((resolve, reject) => {
  //     auth.getOAuthRequestToken((err, token: string, secret: string) => {
  //       if (err) {
  //         this.logger.error(err, '', 'Start auth failure');
  //         reject(
  //           new ApiResponse<any>({ error: JSON.stringify(err) }),
  //         );
  //         return;
  //       }
  //       resolve(
  //         new ApiResponse<TumblrOAuthData>({
  //           data: {
  //             token,
  //             secret,
  //             url: `${this.CONFIG.URI.AUTHORIZE_URL}?oauth_token=${token}`,
  //           },
  //         }),
  //       );
  //     });
  //   });
  // }

  // completeAuthorization(
  //   data: TumblrAuthorization,
  // ): Promise<ApiResponse<TumblrAuthData>> {
  //   const auth = this.getOAuth();
  //   return new Promise((resolve, reject) => {
  //     auth.getOAuthAccessToken(
  //       data.token,
  //       data.secret,
  //       data.verifier,
  //       (err, token: string, secret: string) => {
  //         if (err) {
  //           this.logger.error(err, '', 'Complete Authorization Failure');
  //           reject(
  //             new ApiResponse<any>({ error: JSON.stringify(err) }),
  //           );
  //           return;
  //         }

  //         const client = Tumblr.createClient({
  //           consumer_key: this.CONFIG.KEY,
  //           consumer_secret: this.CONFIG.SECRET,
  //           token: token,
  //           token_secret: secret,
  //         });

  //         client.userInfo((err: any, data: { user: TumblrAccountData }) => {
  //           if (err) {
  //             this.logger.error(err, '', 'Issue getting user info');
  //             reject(
  //               new ApiResponse<any>({ error: err }),
  //             );
  //             return;
  //           }
  //           resolve(
  //             new ApiResponse<TumblrAuthData>({
  //               data: {
  //                 token,
  //                 secret,
  //                 user: {
  //                   name: data.user.name,
  //                   blogs: data.user.blogs,
  //                 },
  //               },
  //             }),
  //           );
  //         });
  //       },
  //     );
  //   });
  // }

  // // More of a token check
  // refreshToken(
  //   data: TumblrRefresh,
  // ): Promise<ApiResponse<{ user: TumblrAccountData }>> {
  //   const client = Tumblr.createClient({
  //     consumer_key: this.CONFIG.KEY,
  //     consumer_secret: this.CONFIG.SECRET,
  //     token: data.token,
  //     token_secret: data.secret,
  //   });

  //   return new Promise((resolve, reject) => {
  //     client.userInfo((err, data: { user: TumblrAccountData }) => {
  //       if (err) {
  //         this.logger.error(err, '', 'Issue getting user info');
  //         reject(
  //           new ApiResponse<any>({ error: err }),
  //         );
  //         return;
  //       }
  //       resolve(
  //         new ApiResponse<any>({
  //           data: {
  //             user: {
  //               name: data.user.name,
  //               blogs: data.user.blogs,
  //             },
  //           },
  //         }),
  //       );
  //     });
  //   });
  // }

  // post(data: SubmissionPost<TumblrPostOptions>) {
  //   if (!data.options.blog) {
  //     return new ApiResponse({ error: 'No blog provided' });
  //   }

  //   const type = data.files.length
  //     ? getSubmissionType(data.files[0].contentType, data.files[0].filename)
  //     : null;

  //   const form: any = {
  //     tags: data.tags.map(t => `#${t.trim()}`).join(','),
  //   };

  //   switch (type) {
  //     case null:
  //       form.type = 'text';
  //       form.title = data.title;
  //       form.body = data.description;
  //       break;
  //     case FileSubmissionType.IMAGE:
  //       form.type = 'photo';
  //       form.caption = `${data.title}${data.description}`;
  //       data.getFilesforPost().forEach((d, i) => {
  //         form[`data[${i}]`] = d;
  //       });
  //       break;
  //     case FileSubmissionType.VIDEO:
  //       form.type = 'video';
  //       form.caption = data.description;
  //       form.data = data.getFilesforPost()[0];
  //       break;
  //     default: {
  //       return new ApiResponse({ error: 'Unsupported posting type' });
  //     }
  //   }

  //   const oauth = {
  //     consumer_key: this.CONFIG.KEY,
  //     consumer_secret: this.CONFIG.SECRET,
  //     token: data.token,
  //     token_secret: data.secret,
  //   };

  //   return new Promise((resolve, reject) => {
  //     request.post(
  //       {
  //         url: `https://api.tumblr.com/v2/blog/${data.options.blog}/post`,
  //         oauth,
  //         formData: form,
  //       },
  //       (err, res, body: string) => {
  //         let json: any = {};
  //         try {
  //           json = JSON.parse(body);
  //         } catch (e) {
  //           this.logger.error(body, '', 'Unable to parse body from post');
  //           reject(
  //             new ApiResponse({ error: 'Unable to determine post success. ' }),
  //           );
  //           return;
  //         }
  //         if (err || json.errors) {
  //           reject(
  //             new ApiResponse({
  //               error: (json.errors || [])
  //                 .map(error => `${error.title} - ${error.detail}`)
  //                 .join('\n'),
  //             }),
  //           );
  //         } else {
  //           resolve(new ApiResponse({ data: json.response }));
  //         }
  //       },
  //     );
  //   });
  // }
}
