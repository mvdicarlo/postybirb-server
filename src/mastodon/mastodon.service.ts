import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Mastodon from 'mastodon-api';
import { Model } from 'mongoose';
import { ApiResponse } from 'src/common/models/api-response.model';
import { MastodonInstance } from './mastodon.schema';
import { MastodonAuthorization } from './models/mastodon-authorization.model';

@Injectable()
export class MastodonService {
  private readonly logger = new Logger(MastodonService.name);

  constructor(
    @InjectModel('Mastodon')
    private readonly repository: Model<MastodonInstance>,
  ) {}

  async startAuthorization(website: string): Promise<string> {
    let model = await this.findMastodonInstance(website);
    if (!model) {
      model = await this.register(website);
    }

    try {
      return await Mastodon.getAuthorizationUrl(
        model.client_id,
        model.client_secret,
        model.website,
        'read write',
        'urn:ietf:wg:oauth:2.0:oob',
      );
    } catch (err) {
      this.logger.error(err, '', `Mastodon Auth URL Failure ${website}`);
      throw new InternalServerErrorException(
        `Unable to authorize ${website} at this time`,
      );
    }
  }

  async completeAuthorization(
    data: MastodonAuthorization,
  ): Promise<ApiResponse<{ token: string; username: string }>> {
    const model = await this.findMastodonInstance(data.website);
    if (!model) {
      return new ApiResponse({
        error: `Unable to authenticate to an unregistered Mastodon instance ${data.website}`,
      });
    }

    try {
      const token = await Mastodon.getAccessToken(
        model.client_id,
        model.client_secret,
        data.code,
        data.website,
      );

      const M = new Mastodon({
        access_token: token,
        api_url: `${data.website}/api/v1/`,
      });

      const info: { data: { username: string } } = await M.get(
        'accounts/verify_credentials',
        {},
      );

      return new ApiResponse({ data: { token, username: info.data.username } });
    } catch (err) {
      const errString = `Unable to complete ${data.website} authentication`;
      this.logger.error(err, '', errString);
      return new ApiResponse({ error: errString });
    }
  }

  private async findMastodonInstance(
    website: string,
  ): Promise<MastodonInstance> {
    return this.repository.findOne({ website }).exec();
  }

  private async register(website: string): Promise<MastodonInstance> {
    this.logger.log(`Registering ${website}`);
    try {
      const registered = await Mastodon.createOAuthApp(
        `${website}/api/v1/apps`,
        'PostyBirb',
        'read write',
      );

      const model = new this.repository({
        website,
        client_id: registered.client_id,
        client_secret: registered.client_secret,
      });
      return model.save();
    } catch (err) {
      this.logger.error(err, '', `Mastodon Registration Failed: ${website}`);
      throw new ApiResponse({
        error: `Unable to register ${website} as a Mastodon instance. Check that the website you provided is correct and has no redirect.`,
      });
    }
  }
}
