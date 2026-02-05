import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ required: true, enum: ['github', 'google'] })
  provider: string;

  @Prop({ required: true })
  providerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });
