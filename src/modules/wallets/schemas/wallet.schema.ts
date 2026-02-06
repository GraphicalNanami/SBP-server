import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' } })
export class Wallet extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  address: string;

  @Prop()
  nickname: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  lastUsedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Compound index for quick primary wallet lookup
WalletSchema.index({ userId: 1, isPrimary: 1 });
