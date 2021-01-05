import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MastodonInstance extends Document {
  @Prop()
  website: string;

  @Prop()
  client_id: string;

  @Prop()
  client_secret: string;
}

export const MastodonInstanceSchema = SchemaFactory.createForClass(
  MastodonInstance,
);
