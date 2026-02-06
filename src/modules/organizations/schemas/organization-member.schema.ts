import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { MemberStatus } from '@/src/modules/organizations/enums/member-status.enum';
import { Organization } from '@/src/modules/organizations/schemas/organization.schema';
import { User } from '@/src/modules/users/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class OrganizationMember extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4(),
  })
  uuid: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Organization;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: User;

  @Prop({
    type: String,
    enum: MemberRole,
    default: MemberRole.VIEWER,
  })
  role: MemberRole;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  invitedBy: User;

  @Prop({ default: Date.now })
  invitedAt: Date;

  @Prop()
  joinedAt?: Date;

  @Prop({
    type: String,
    enum: MemberStatus,
    default: MemberStatus.PENDING,
  })
  status: MemberStatus;
}

export const OrganizationMemberSchema =
  SchemaFactory.createForClass(OrganizationMember);

OrganizationMemberSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true },
);
