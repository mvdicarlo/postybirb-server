import { Injectable, Logger, HttpException } from '@nestjs/common';
import TwitterAPI from 'node-twitter-api';
import { OAuth } from 'oauth';
import {
  TwitterAuthDto,
  TwitterPostDto,
  MediaObject,
} from './twitter.interface';
import * as request from 'request';
import partition from 'partition-all';
import * as streamify from 'streamifier';
import { Readable } from 'stream';

@Injectable()
export class TwitterService {
  private readonly logger: Logger = new Logger(TwitterService.name);
  private readonly MAX_FILE_CHUNK: number = 5 * 1024 * 1024;

  private readonly TWITTER: any = {
    key: process.env.TWITTER_KEY,
    secret: process.env.TWITTER_SECRET,
    authorizer: new TwitterAPI({
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callback: 'oob',
    }),
  };

  private getAuthGenerator(): any {
    return new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.TWITTER.key,
      this.TWITTER.secret,
      '1.0',
      'oob',
      'HMAC-SHA1',
    );
  }

  public createOAuth(): Promise<{
    token: string;
    secret: string;
    url: string;
  }> {
    const oauth = this.getAuthGenerator();
    return new Promise((resolve, reject) => {
      oauth.getOAuthRequestToken(
        (err, oauth_token, oauth_token_secret, results) => {
          if (err) {
            this.logger.error(err);
            reject(new HttpException('Unable to authorize Twitter', 500));
          }

          resolve({
            token: oauth_token,
            secret: oauth_token_secret,
            url: `https://twitter.com/oauth/authenticate?oauth_token=${oauth_token}`,
          });
        },
      );
    });
  }

  public authorizePIN(
    auth: TwitterAuthDto,
  ): Promise<{ accessToken: string; accessTokenSecret: string; results: any }> {
    return new Promise((resolve, reject) => {
      this.TWITTER.authorizer.getAccessToken(
        auth.token,
        auth.secret,
        auth.pin,
        (err, accessToken, accessTokenSecret, results) => {
          if (err) {
            this.logger.error(err);
            reject(
              new HttpException('Unable to authorize Twitter client', 500),
            );
          }

          resolve({
            accessToken,
            accessTokenSecret,
            results,
          });
        },
      );
    });
  }

  public async postStatus(postData: TwitterPostDto): Promise<any> {
    const clientAuth = this.getAuthGenerator();

    // Status with media content
    if (postData.medias && postData.medias.length > 0) {
      const api = new TwitterAPI({
        consumerKey: this.TWITTER.key,
        consumerSecret: this.TWITTER.secret,
        callback: 'oob',
      });

      const uploadPromises = postData.medias.map(media =>
        this.upload(clientAuth, media, postData.token, postData.secret),
      );
      let primaryStatusId: string = null;
      try {
        const results = await Promise.all(uploadPromises);
        const partitions: any[] = partition(4, results);
        const allRes = [];
        for (let i = 0; i < partitions.length; i++) {
          const p = partitions[i];
          const res: any = await this.postMedias(
            p,
            clientAuth,
            postData,
            primaryStatusId,
          );
          allRes.push(res);
          if (res.error) {
            throw new HttpException(res.error, 500);
          }

          if (res.data && !primaryStatusId) {
            const data = JSON.parse(res.data);
            primaryStatusId = data.id;
          }
        }

        return allRes;
      } catch (err) {
        this.logger.error(err);
        throw new HttpException(err, 500);
      }
    } else {
      // Normal Status Post
      const res: any = await new Promise(resolve => {
        clientAuth.post(
          'https://api.twitter.com/1.1/statuses/update.json',
          postData.token,
          postData.secret,
          {
            status: postData.status,
          },
          (err, data, r) => {
            if (err) {
              this.logger.error('Failed to upload text status');
              this.logger.error(err);
              const errors = [];
              if (err.data) {
                const json = JSON.parse(err.data);
                json.errors.forEach(e => {
                  errors.push(e.message);
                });
              }
              resolve({ error: errors });
            } else {
              resolve({});
            }
          },
        );
      });

      if (res.error) {
        throw new HttpException(res.error, 500);
      }

      return res;
    }
  }

  private postMedias(
    results: any[],
    clientAuth: any,
    postData: any,
    replyId?: any,
  ): Promise<any> {
    const post: any = {
      status: postData.status,
      media_ids: results.slice(0, 4).join(','),
    };

    if (postData.sensitive) {
      post.possibly_sensitive = true;
    }

    if (replyId) {
      post.in_reply_to_status_id = replyId;
    }

    return new Promise(resolve => {
      clientAuth.post(
        'https://api.twitter.com/1.1/statuses/update.json',
        postData.token,
        postData.secret,
        post,
        (err, data, resp) => {
          if (err) {
            this.logger.error('Failed to upload image status');
            this.logger.error(err);
            const errors = [];
            if (err.data) {
              const json = JSON.parse(err.data);
              json.errors.forEach(e => {
                errors.push(e.message);
              });
            }
            resolve({ error: errors });
          } else {
            resolve({ data });
          }
        },
      );
    });
  }

  private async upload(
    auth: any,
    media: MediaObject,
    token: string,
    secret: string,
  ): Promise<any> {
    const buffer: Buffer = Buffer.from(media.base64, 'base64');
    const data: any = {
      command: 'INIT',
      media_type: media.type,
      total_bytes: buffer.length,
      media_category: 'tweet_image',
    };

    if (media.type.includes('image') && media.type.includes('gif')) {
      data.media_category = 'tweet_gif';
    } else if (media.type.includes('video')) {
      data.media_category = 'tweet_video';
    }

    const media_id = await new Promise((resolve, reject) => {
      auth.post(
        'https://upload.twitter.com/1.1/media/upload.json',
        token,
        secret,
        data,
        (e, data, resp) => {
          if (e) {
            this.logger.error(e);
            if (e.data) {
              let data: any = e.data;
              try {
                const json = JSON.parse(data);
                data = json.errors.map(err => err.message);
              } catch (err) {}
              reject(data);
            } else reject(e);
          } else {
            let id = null;
            try {
              id =
                typeof data === 'string'
                  ? JSON.parse(data).media_id_string
                  : data.media_id_string;
              resolve(id);
            } catch (parseError) {
              reject(parseError);
              return;
            }
          }
        },
      );
    });

    const readable: Readable = streamify.createReadStream(buffer);
    let buf: any;
    const partitions: Buffer[] = [];
    while (
      (buf = readable.read(Math.min(this.MAX_FILE_CHUNK, buffer.length)))
    ) {
      partitions.push(buf);
    }

    const oauth = {
      consumer_key: this.TWITTER.key,
      consumer_secret: this.TWITTER.secret,
      token,
      token_secret: secret,
    };

    const promises: Promise<boolean>[] = [];
    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];
      const formData = {
        command: 'APPEND',
        media_id,
        media_data: partition.toString('base64'),
        segment_index: i,
      };

      promises.push(
        new Promise((resolve, reject) => {
          request.post(
            {
              url: 'https://upload.twitter.com/1.1/media/upload.json',
              oauth,
              formData,
            },
            (err, resp, body) => {
              if (err) {
                this.logger.error(err);
                reject(err);
              } else {
                resolve(true);
              }
            },
          );
        }),
      );
    }

    const uploadedChunks = await Promise.all(promises);

    const finalizePromise = await new Promise((resolve, reject) => {
      auth.post(
        'https://upload.twitter.com/1.1/media/upload.json',
        token,
        secret,
        {
          command: 'FINALIZE',
          media_id,
        },
        (e, data, resp) => {
          if (e) {
            this.logger.error('Failed to upload media chunks');
            this.logger.error(e);
            reject(e);
          } else {
            resolve();
          }
        },
      );
    });

    return media_id;
  }
}
