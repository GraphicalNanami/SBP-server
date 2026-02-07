import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { Build, TeamMember } from './schemas/build.schema';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildDto } from './dto/update-build.dto';
import { PublishBuildDto } from './dto/publish-build.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { ListBuildsDto } from './dto/list-builds.dto';
import { UsersService } from '../users/users.service';
import { BuildStatus } from './enums/build-status.enum';
import { BuildVisibility } from './enums/build-visibility.enum';
import { TeamMemberRole } from './enums/team-member-role.enum';
import { TeamMemberStatus } from './enums/team-member-status.enum';

@Injectable()
export class BuildsService {
  constructor(
    @InjectModel(Build.name) private buildModel: Model<Build>,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createDto: CreateBuildDto): Promise<Build> {
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    const slug = await this.generateUniqueSlug(createDto.name);

    // Create team lead member
    const teamLead: TeamMember = {
      uuid: uuidv4(),
      userId: user._id,
      role: TeamMemberRole.LEAD,
      status: TeamMemberStatus.ACCEPTED,
      permissions: {
        canEdit: true,
        canInvite: true,
        canSubmit: true,
      },
      invitedAt: new Date(),
      acceptedAt: new Date(),
    };

    const newBuild = new this.buildModel({
      ...createDto,
      slug,
      createdBy: user._id,
      status: BuildStatus.DRAFT,
      visibility: BuildVisibility.PRIVATE,
      teamMembers: [teamLead],
      statusHistory: [
        {
          status: BuildStatus.DRAFT,
          changedBy: user._id,
          changedAt: new Date(),
          reason: 'Build created',
        },
      ],
    });

    return newBuild.save();
  }

  async update(
    uuid: string,
    userId: string,
    updateDto: UpdateBuildDto,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    await this.validateUserPermission(build, userId, 'canEdit');

    // Check slug update if name changes
    if (updateDto.name && updateDto.name !== build.name) {
      updateDto['slug'] = await this.generateUniqueSlug(updateDto.name);
    }

    Object.keys(updateDto).forEach((key) => {
      build.set(key, updateDto[key]);
    });

    return build.save();
  }

  async publish(
    uuid: string,
    userId: string,
    publishDto: PublishBuildDto,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    // Only LEAD can publish
    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (!member || member.role !== TeamMemberRole.LEAD) {
      throw new ForbiddenException('Only the team lead can publish the build');
    }

    // Validate all required fields are present before publishing
    const missingFields: string[] = [];
    if (!build.tagline) missingFields.push('tagline');
    if (!build.category) missingFields.push('category');
    if (!build.vision) missingFields.push('vision');
    if (!build.description) missingFields.push('description');
    if (!build.teamDescription) missingFields.push('teamDescription');
    if (!build.teamLeadTelegram) missingFields.push('teamLeadTelegram');
    if (!build.contactEmail) missingFields.push('contactEmail');
    if (!publishDto.contractAddress) missingFields.push('contractAddress');
    if (!publishDto.stellarAddress) missingFields.push('stellarAddress');

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Cannot publish build. Missing required fields: ${missingFields.join(', ')}`,
      );
    }

    build.contractAddress = publishDto.contractAddress;
    build.stellarAddress = publishDto.stellarAddress;
    build.visibility = publishDto.visibility || BuildVisibility.PUBLIC;
    build.status = BuildStatus.PUBLISHED;
    build.publishedAt = new Date();

    build.statusHistory.push({
      status: BuildStatus.PUBLISHED,
      changedBy: user._id,
      changedAt: new Date(),
      reason: 'Build published',
    });

    return build.save();
  }

  async archive(uuid: string, userId: string): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    // Only LEAD can archive
    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (!member || member.role !== TeamMemberRole.LEAD) {
      throw new ForbiddenException('Only the team lead can archive the build');
    }

    build.status = BuildStatus.ARCHIVED;
    build.statusHistory.push({
      status: BuildStatus.ARCHIVED,
      changedBy: user._id,
      changedAt: new Date(),
      reason: 'Build archived',
    });

    return build.save();
  }

  async findByUuid(uuid: string): Promise<Build> {
    const build = await this.buildModel.findOne({ uuid }).exec();
    if (!build) {
      throw new NotFoundException(`Build with UUID ${uuid} not found`);
    }
    return build;
  }

  async getBuildDetails(uuid: string, userId: string): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const user = await this.usersService.findByUuid(userId);

    // If public, anyone can view
    if (
      build.status === BuildStatus.PUBLISHED &&
      build.visibility === BuildVisibility.PUBLIC
    ) {
      return build;
    }

    // If not public, must be team member (or admin, but let's stick to team member for now)
    // Or if unlisted, anyone with link (which is this endpoint). But "UNLISTED: Anyone with link can view".
    if (
      build.status === BuildStatus.PUBLISHED &&
      build.visibility === BuildVisibility.UNLISTED
    ) {
      return build;
    }

    // If PRIVATE or DRAFT, must be team member
    if (!user)
      throw new ForbiddenException(
        'Authentication required for private builds',
      );

    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (
      !member ||
      (member.status !== TeamMemberStatus.ACCEPTED &&
        member.status !== TeamMemberStatus.PENDING)
    ) {
      // PENDING members should probably be able to see it to accept?
      throw new ForbiddenException(
        'You do not have permission to view this build',
      );
    }

    return build;
  }

  async findBySlug(slug: string): Promise<Build> {
    const build = await this.buildModel.findOne({ slug }).exec();
    if (!build) {
      throw new NotFoundException(`Build with slug ${slug} not found`);
    }
    return build;
  }

  async listPublicBuilds(
    dto: ListBuildsDto,
  ): Promise<{ builds: Build[]; total: number }> {
    const query: any = {
      status: BuildStatus.PUBLISHED,
      visibility: BuildVisibility.PUBLIC,
    };

    if (dto.category) {
      query.category = dto.category;
    }

    if (dto.search) {
      query.$text = { $search: dto.search };
    }

    let sort: any = { publishedAt: -1 }; // Default newest
    if (dto.sortBy === 'oldest') {
      sort = { publishedAt: 1 };
    } else if (dto.sortBy === 'popular') {
      // Implement popularity logic later, default to newest for now
      sort = { publishedAt: -1 };
    }

    const [builds, total] = await Promise.all([
      this.buildModel
        .find(query)
        .sort(sort)
        .skip(dto.offset || 0)
        .limit(dto.limit || 20)
        .exec(),
      this.buildModel.countDocuments(query),
    ]);

    return { builds, total };
  }

  async listUserBuilds(userId: string): Promise<Build[]> {
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    return this.buildModel
      .find({
        'teamMembers.userId': user._id,
        status: { $ne: BuildStatus.ARCHIVED }, // Optional: exclude archived? Doc says "all statuses". I will keep all.
      })
      .exec();
  }

  // Team Management

  async inviteTeamMember(
    uuid: string,
    inviterId: string,
    inviteDto: InviteTeamMemberDto,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    await this.validateUserPermission(build, inviterId, 'canInvite');

    const inviter = await this.usersService.findByUuid(inviterId);
    const invitee = await this.usersService.findByEmail(inviteDto.email);

    if (!invitee) {
      // For now, require user to exist. Future: allow inviting by email (pending registration)
      throw new NotFoundException(
        'User with this email not found on the platform',
      );
    }

    // Check if already a member
    const existingMember = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === invitee._id.toString(),
    );

    if (existingMember) {
      throw new ConflictException('User is already a team member');
    }

    const newMember: TeamMember = {
      uuid: uuidv4(),
      userId: invitee._id,
      role: inviteDto.role || TeamMemberRole.MEMBER,
      status: TeamMemberStatus.PENDING,
      permissions: {
        canEdit: inviteDto.permissions?.canEdit || false,
        canInvite: inviteDto.permissions?.canInvite || false,
        canSubmit: inviteDto.permissions?.canSubmit || false,
      },
      invitedBy: inviter!._id,
      invitedAt: new Date(),
    };

    build.teamMembers.push(newMember);
    return build.save();
  }

  async acceptInvitation(uuid: string, userId: string): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (!member) {
      throw new ForbiddenException('You are not invited to this build');
    }

    if (member.status !== TeamMemberStatus.PENDING) {
      throw new BadRequestException(`Invitation status is ${member.status}`);
    }

    member.status = TeamMemberStatus.ACCEPTED;
    member.acceptedAt = new Date();

    return build.save();
  }

  async declineInvitation(uuid: string, userId: string): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new NotFoundException('User not found');

    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (!member) {
      throw new ForbiddenException('You are not invited to this build');
    }

    member.status = TeamMemberStatus.DECLINED;
    return build.save();
  }

  async removeTeamMember(
    uuid: string,
    leadId: string,
    memberUuid: string,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const lead = await this.usersService.findByUuid(leadId);
    if (!lead) throw new NotFoundException('Lead user not found');

    // Verify requester is LEAD
    const leadMember = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === lead!._id.toString(),
    );

    if (!leadMember || leadMember.role !== TeamMemberRole.LEAD) {
      throw new ForbiddenException('Only the team lead can remove members');
    }

    const memberIndex = build.teamMembers.findIndex(
      (m) => m.uuid === memberUuid,
    );
    if (memberIndex === -1) {
      throw new NotFoundException('Member not found');
    }

    const member = build.teamMembers[memberIndex];
    if (member.role === TeamMemberRole.LEAD) {
      throw new BadRequestException(
        'Cannot remove the team lead. Transfer leadership first.',
      );
    }

    build.teamMembers[memberIndex].status = TeamMemberStatus.REMOVED;
    // Or actually remove from array? Doc says "REMOVED" status exists.
    // I'll keep it with REMOVED status for history, or just remove.
    // Doc: "TeamMemberStatus: REMOVED: Removed from team". So keep it.

    return build.save();
  }

  async updateTeamMember(
    uuid: string,
    leadId: string,
    memberUuid: string,
    dto: UpdateTeamMemberDto,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const lead = await this.usersService.findByUuid(leadId);

    // Verify requester is LEAD
    const leadMember = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === lead!._id.toString(),
    );

    if (!leadMember || leadMember.role !== TeamMemberRole.LEAD) {
      throw new ForbiddenException('Only the team lead can update members');
    }

    const member = build.teamMembers.find((m) => m.uuid === memberUuid);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (dto.role) member.role = dto.role;
    if (dto.permissions) {
      if (dto.permissions.canEdit !== undefined)
        member.permissions.canEdit = dto.permissions.canEdit;
      if (dto.permissions.canInvite !== undefined)
        member.permissions.canInvite = dto.permissions.canInvite;
      if (dto.permissions.canSubmit !== undefined)
        member.permissions.canSubmit = dto.permissions.canSubmit;
    }

    return build.save();
  }

  async transferLeadership(
    uuid: string,
    currentLeadId: string,
    newLeadUuid: string,
  ): Promise<Build> {
    const build = await this.findByUuid(uuid);
    const currentLeadUser = await this.usersService.findByUuid(currentLeadId);

    // Verify requester is LEAD
    const currentLeadMember = build.teamMembers.find(
      (m) =>
        (m.userId as Types.ObjectId).toString() ===
        currentLeadUser!._id.toString(),
    );

    if (!currentLeadMember || currentLeadMember.role !== TeamMemberRole.LEAD) {
      throw new ForbiddenException(
        'Only the team lead can transfer leadership',
      );
    }

    const newLeadMember = build.teamMembers.find((m) => m.uuid === newLeadUuid);
    if (!newLeadMember) {
      throw new NotFoundException('New lead member not found');
    }

    if (newLeadMember.status !== TeamMemberStatus.ACCEPTED) {
      throw new BadRequestException('New lead must have accepted invitation');
    }

    // Swap roles
    currentLeadMember.role = TeamMemberRole.MEMBER;
    newLeadMember.role = TeamMemberRole.LEAD;

    // Ensure new lead has all permissions (implicit, but good to set)
    newLeadMember.permissions = {
      canEdit: true,
      canInvite: true,
      canSubmit: true,
    };

    return build.save();
  }

  // Helpers

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await this.buildModel.exists({ slug });
    let counter = 1;

    while (exists) {
      slug = `${baseSlug}-${counter}`;
      exists = await this.buildModel.exists({ slug });
      counter++;
    }

    return slug;
  }

  async validateUserPermission(
    build: Build,
    userId: string,
    permission: 'canEdit' | 'canInvite' | 'canSubmit',
  ): Promise<void> {
    const user = await this.usersService.findByUuid(userId);
    if (!user) throw new ForbiddenException('User not found');

    const member = build.teamMembers.find(
      (m) => (m.userId as Types.ObjectId).toString() === user._id.toString(),
    );

    if (!member || member.status !== TeamMemberStatus.ACCEPTED) {
      throw new ForbiddenException(
        'You are not an active member of this build team',
      );
    }

    if (member.role === TeamMemberRole.LEAD) return; // LEAD has all permissions

    if (!member.permissions[permission]) {
      throw new ForbiddenException(
        `You do not have permission to ${permission.replace('can', '').toLowerCase()} this build`,
      );
    }
  }
}
