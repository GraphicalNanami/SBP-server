import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationMember } from '@/src/modules/organizations/schemas/organization-member.schema';
import { Organization } from '@/src/modules/organizations/schemas/organization.schema';
import { UsersService } from '@/src/modules/users/users.service';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { MemberStatus } from '@/src/modules/organizations/enums/member-status.enum';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMember>,
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    private usersService: UsersService,
  ) {}

  private async resolveUserId(userId: string | Types.ObjectId): Promise<Types.ObjectId> {
    if (typeof userId === 'string' && UuidUtil.validate(userId)) {
      const user = await this.usersService.findByUuid(userId);
      if (!user) throw new NotFoundException('User not found');
      return user._id as Types.ObjectId;
    }
    return typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  }

  private async resolveOrgId(orgId: string): Promise<Types.ObjectId> {
    if (UuidUtil.validate(orgId)) {
        const org = await this.organizationModel.findOne({ uuid: orgId });
        if (!org) throw new NotFoundException('Organization not found');
        return org._id as Types.ObjectId;
    }
    return new Types.ObjectId(orgId);
  }

  async findByOrganizationId(
    orgId: string,
    filters: { status?: MemberStatus; role?: MemberRole } = {},
  ) {
    const oId = await this.resolveOrgId(orgId);
    
    const query: any = { organizationId: oId };
    if (filters.status) query.status = filters.status;
    if (filters.role) query.role = filters.role;

    return this.memberModel
      .find(query)
      .populate('userId', 'name email avatar')
      .populate('invitedBy', 'name email avatar')
      .exec();
  }

  async inviteMember(
    orgId: string,
    invitedBy: string,
    email: string,
    role: MemberRole,
  ) {
    const oId = await this.resolveOrgId(orgId);
    const uInvitedBy = await this.resolveUserId(invitedBy);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const existingMember = await this.memberModel.findOne({
      organizationId: oId,
      userId: user._id,
    });

    if (existingMember) {
      if (existingMember.status === MemberStatus.ACTIVE) {
        throw new ConflictException(
          'User is already an active member of this organization',
        );
      }
      if (existingMember.status === MemberStatus.PENDING) {
        throw new ConflictException(
          'Invitation is already pending for this user',
        );
      }

      // If removed, we re-invite
      existingMember.status = MemberStatus.PENDING;
      existingMember.role = role;
      existingMember.invitedBy = uInvitedBy as any;
      existingMember.invitedAt = new Date();
      existingMember.joinedAt = undefined;
      return existingMember.save();
    }

    const newMember = new this.memberModel({
      organizationId: oId,
      userId: user._id,
      role,
      invitedBy: uInvitedBy,
      status: MemberStatus.PENDING,
    });

    // Auto-accept in initial implementation
    newMember.status = MemberStatus.ACTIVE;
    newMember.joinedAt = new Date();

    return newMember.save();
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    newRole: MemberRole,
    updatedBy: string,
  ) {
    const oId = await this.resolveOrgId(orgId);
    const uUpdatedBy = await this.resolveUserId(updatedBy);
    
    let query: any = { organizationId: oId };
    if (UuidUtil.validate(memberId)) {
        query.uuid = memberId;
    } else {
        query._id = new Types.ObjectId(memberId);
    }

    const member = await this.memberModel.findOne(query);
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    if (member.userId.toString() === uUpdatedBy.toString()) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (member.role === MemberRole.ADMIN && newRole !== MemberRole.ADMIN) {
      const adminCount = await this.memberModel.countDocuments({
        organizationId: oId,
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'At least one admin must exist in the organization',
        );
      }
    }

    member.role = newRole;
    return member.save();
  }

  async removeMember(orgId: string, memberId: string, removedBy: string) {
    const oId = await this.resolveOrgId(orgId);
    const uRemovedBy = await this.resolveUserId(removedBy);

    let query: any = { organizationId: oId };
    if (UuidUtil.validate(memberId)) {
        query.uuid = memberId;
    } else {
        query._id = new Types.ObjectId(memberId);
    }

    const member = await this.memberModel.findOne(query);
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    if (member.userId.toString() === uRemovedBy.toString()) {
      throw new BadRequestException(
        'You cannot remove yourself from the organization',
      );
    }

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.memberModel.countDocuments({
        organizationId: oId,
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last admin of the organization',
        );
      }
    }

    member.status = MemberStatus.REMOVED;
    return member.save();
  }

  async getMember(
    orgId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const oId = await this.resolveOrgId(orgId);
    const uId = await this.resolveUserId(userId);

    return this.memberModel.findOne({
      organizationId: oId,
      userId: uId,
      status: MemberStatus.ACTIVE,
    });
  }

  async getUserRole(orgId: string, userId: string): Promise<MemberRole | null> {
    const member = await this.getMember(orgId, userId);
    return member ? member.role : null;
  }
}

