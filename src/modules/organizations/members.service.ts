import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrganizationMember } from './schemas/organization-member.schema';
import { UsersService } from '../users/users.service';
import { MemberRole } from './enums/member-role.enum';
import { MemberStatus } from './enums/member-status.enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMember>,
    private usersService: UsersService,
  ) {}

  async findByOrganizationId(
    orgId: string,
    filters: { status?: MemberStatus; role?: MemberRole } = {},
  ) {
    const query: any = { organizationId: orgId };
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
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const existingMember = await this.memberModel.findOne({
      organizationId: orgId,
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
      existingMember.invitedBy = invitedBy as any;
      existingMember.invitedAt = new Date();
      existingMember.joinedAt = undefined;
      return existingMember.save();
    }

    const newMember = new this.memberModel({
      organizationId: orgId,
      userId: user._id,
      role,
      invitedBy,
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
    const member = await this.memberModel.findOne({
      _id: memberId,
      organizationId: orgId,
    });
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    if (member.userId.toString() === updatedBy) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (member.role === MemberRole.ADMIN && newRole !== MemberRole.ADMIN) {
      const adminCount = await this.memberModel.countDocuments({
        organizationId: orgId,
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
    const member = await this.memberModel.findOne({
      _id: memberId,
      organizationId: orgId,
    });
    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    if (member.userId.toString() === removedBy) {
      throw new BadRequestException(
        'You cannot remove yourself from the organization',
      );
    }

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.memberModel.countDocuments({
        organizationId: orgId,
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
    return this.memberModel.findOne({
      organizationId: orgId,
      userId,
      status: MemberStatus.ACTIVE,
    });
  }

  async getUserRole(orgId: string, userId: string): Promise<MemberRole | null> {
    const member = await this.getMember(orgId, userId);
    return member ? member.role : null;
  }
}
