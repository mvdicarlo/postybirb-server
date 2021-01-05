import * as mongoose from 'mongoose';

export const MastodonSchema = new mongoose.Schema({
  website: String,
  client_id: String,
  client_secret: String
});


export interface IMastodon {
  website: string;
  client_id: string;
  client_secret: string;
}
