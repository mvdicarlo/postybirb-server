import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as request from 'request';
import { ApiResponse } from 'src/v2/common/models/api-response.model';
import {
  RequestFile,
  SubmissionPost,
} from 'src/v2/common/models/submission-post.model';
import Twitter, {
  AccessTokenResponse,
  TokenResponse,
  TwitterOptions,
} from 'twitter-lite';
import {
  ContentBlurType,
  ESensitiveMediaWarnings_Utils,
} from './enums/twitter-sensitive-media-warnings.enum';
import { ImediaMetadataBody } from './interfaces/twitter-media-metadata-body.interface';
import { TwitterAuthorization } from './models/twitter-authorization.model';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  private readonly MAX_FILE_CHUNK: number = 5 * 1024 * 1024;
  private readonly CONFIG = {
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
  };

  private getClient(token?: TokenResponse) {
    const config: TwitterOptions = {
      ...this.CONFIG,
    };
    if (token) {
      config.access_token_key = token.oauth_token;
      config.access_token_secret = token.oauth_token_secret;
    }
    return new Twitter(config);
  }

  async startAuthorization(): Promise<
    ApiResponse<{ url: string; oauth_token: string }>
  > {
    try {
      const auth = await this.getClient().getRequestToken('oob');
      return new ApiResponse({
        data: {
          url: `https://api.twitter.com/oauth/authenticate?oauth_token=${auth.oauth_token}`,
          oauth_token: auth.oauth_token,
        },
      });
    } catch (err) {
      this.logger.error(err, err.stack, 'Twitter Auth Start Failure');
      return new ApiResponse({ error: err });
    }
  }

  async completeAuthorization(
    data: TwitterAuthorization,
  ): Promise<ApiResponse<AccessTokenResponse>> {
    try {
      const auth = await this.getClient().getAccessToken({
        oauth_token: data.oauth_token,
        oauth_verifier: data.verifier,
      });
      return new ApiResponse({ data: auth });
    } catch (err) {
      this.logger.error(err, err.stack, 'Twitter Auth Complete Failure');
      return new ApiResponse({ error: err });
    }
  }

  async post(
    data: SubmissionPost<{ contentBlur: ContentBlurType }>,
  ): Promise<ApiResponse<{ url: string }>> {
    const client = this.getClient({
      oauth_token: data.token,
      oauth_token_secret: data.secret,
    });

    const tweets = [];
    const tweet: any = {
      status: data.description || '',
      possibly_sensitive: data.rating !== 'general',
    };

    let mediaIds = [];
    if (data.files.length) {
      // File submissions
      try {
        mediaIds = await Promise.all(
          data.getFilesforPost().map(file => this.uploadMedia(client, file)),
        );

        // Get Twitter warning tag
        const twitterSMW = ESensitiveMediaWarnings_Utils.getSMWFromContentBlur(
          data?.options?.contentBlur,
        ) ?? undefined;
        // And apply it if any
        if (twitterSMW)
          await Promise.all(
            mediaIds.map(mediaIdIter => {
              const mediaMdBody: ImediaMetadataBody = { media_id: mediaIdIter };
              mediaMdBody.sensitive_media_warning = [twitterSMW];
              return client.post('media/metadata/create', mediaMdBody);
            }),
          );
      } catch (err) {
        this.logger.error(err, err.stack, 'Failed to upload files to Twitter');
        return new ApiResponse({ error: err.map(e => e.message).join('\n') });
      }

      const ids = _.chunk(mediaIds, 4);
      ids.forEach((idGroup, i) => {
        const t = { ...tweet, media_ids: idGroup.join(',') };
        if (ids.length > 1) {
          if (i === 0) {
            const numberedStatus = `${i + 1}/${ids.length} ${t.status}`;
            if (numberedStatus.length <= 280) {
              t.status = numberedStatus;
            }
          }
          if (i > 0) {
            t.status = `${i + 1}/${ids.length}`;
          }
        }
        tweets.push(t);
      });
    } else {
      tweets.push(tweet);
    }

    try {
      let url: string;
      let replyId;
      for (const t of tweets) {
        if (replyId) {
          t.in_reply_to_status_id = replyId;
          t.auto_populate_reply_metadata = true;
        }
        const post = await client.post('statuses/update', t);
        if (!url) {
          url = `https://twitter.com/${post.user.screen_name}/status/${post.id_str}`;
        }
        replyId = post.id_str;
      }
      return new ApiResponse({
        data: {
          url,
        },
      });
    } catch (err) {
      this.logger.error(err, '', 'Failed to post');
      return new ApiResponse({
        error: err.errors.map(e => e.message).join('\n'),
      });
    }
  }

  private async uploadMedia(
    client: Twitter,
    file: RequestFile,
  ): Promise<string> {
    const init = {
      command: 'INIT',
      media_type: file.options.contentType,
      total_bytes: file.value.length,
      media_category: 'tweet_image',
    };

    if (file.options.contentType === 'image/gif') {
      init.media_category = 'tweet_gif';
    } else if (!file.options.contentType.includes('image')) {
      // Assume video type
      init.media_category = 'tweet_video';
    }

    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const tokens = client['token'];

    const oauth = {
      consumer_key: this.CONFIG.consumer_key,
      consumer_secret: this.CONFIG.consumer_secret,
      token: tokens.key,
      token_secret: tokens.secret,
    };

    const mediaData: any = await new Promise((resolve, reject) => {
      request.post(
        url,
        {
          json: true,
          form: init,
          oauth,
        },
        (err, res, body) => {
          if (body && body.errors) {
            reject(body.errors);
          } else {
            resolve(body);
          }
        },
      );
    });

    const { media_id_string } = mediaData;
    const chunks = _.chunk(file.value, this.MAX_FILE_CHUNK);
    await Promise.all(
      chunks.map((chunk, i) =>
        this.uploadChunk(oauth, media_id_string, Buffer.from(chunk), i),
      ),
    );

    await new Promise((resolve, reject) => {
      request.post(
        url,
        {
          form: {
            command: 'FINALIZE',
            media_id: media_id_string,
          },
          json: true,
          oauth,
        },
        (err, res, body) => {
          if (body && body.errors) {
            reject(body.errors);
          } else {
            resolve(body);
          }
        },
      );
    });

    return media_id_string;
  }

  private uploadChunk(
    oauth: any,
    id: string,
    chunk: Buffer,
    index: number,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      request.post(
        'https://upload.twitter.com/1.1/media/upload.json',
        {
          formData: {
            command: 'APPEND',
            media_id: id,
            media_data: chunk.toString('base64'),
            segment_index: index,
          },
          json: true,
          oauth,
        },
        (err, res, body) => {
          if (body && body.errors) {
            reject(body.errors);
          } else {
            resolve(body);
          }
        },
      );
    });
  }
}
