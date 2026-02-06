import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@/src/common/enums/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false }) // Never include password in queries by default
  password: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
