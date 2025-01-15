import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ unique: true })
  chatId: number;

  @Prop()
  userName: string;

  @Prop({ default: 0 })
  count: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
