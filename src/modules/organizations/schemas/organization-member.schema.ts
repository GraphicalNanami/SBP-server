import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MemberRole } from '@/modules/organizations/enums/member-role.enum';
import { MemberStatus } from '@/modules/organizations/enums/member-status.enum';
import { Organization } from '@/modules/organizations/schemas/organization.schema';
import { User } from '@/modules/users/schemas/user.schema';

@Schema({ timestamps: true })
export class OrganizationMember extends Document {
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
