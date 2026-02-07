import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Hackathon } from './schemas/hackathon.schema';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import {
  HackathonTimeFilter,
  ListPublicHackathonsDto,
} from './dto/list-public-hackathons.dto';
import { MembersService } from '../organizations/members.service';
import { HackathonStatus } from './enums/hackathon-status.enum';
import { HackathonVisibility } from './enums/hackathon-visibility.enum';
import { MemberRole } from '../organizations/enums/member-role.enum';
import { UuidUtil } from '@/src/common/utils/uuid.util';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class HackathonsService {
  constructor(
    @InjectModel(Hackathon.name) private hackathonModel: Model<Hackathon>,
    private membersService: MembersService,
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
  ) {}

  private async resolveUserId(
    userId: string | Types.ObjectId,
  ): Promise<Types.ObjectId> {
    if (typeof userId === 'string' && UuidUtil.validate(userId)) {
      const user = await this.usersService.findByUuid(userId);
      if (!user) throw new NotFoundException('User not found');
      return user._id;
    }
    return typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  }

  private async resolveOrgId(orgId: string): Promise<Types.ObjectId> {
    if (UuidUtil.validate(orgId)) {
      const org = await this.organizationsService.findById(orgId);
      if (!org) throw new NotFoundException('Organization not found');
      return org._id;
    }
    return new Types.ObjectId(orgId);
  }

  async create(
    userId: string,
    createDto: CreateHackathonDto,
  ): Promise<Hackathon> {
    const uId = await this.resolveUserId(userId);
    const oId = await this.resolveOrgId(createDto.organizationId);

    // Validate user is member of organization
    const member = await this.membersService.getMember(
      createDto.organizationId,
      userId,
    );
    if (!member) {
      throw new ForbiddenException(
        'You must be a member of the organization to create a hackathon',
      );
    }

    // Check name uniqueness within organization
    const existing = await this.hackathonModel.findOne({
      organizationId: oId,
      name: createDto.name,
    });
    if (existing) {
      throw new ConflictException(
        'A hackathon with this name already exists in your organization',
      );
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(createDto.name);

    // Validate timeline
    this.validateTimeline(createDto);

    const newHackathon = new this.hackathonModel({
      ...createDto,
      organizationId: oId,
      slug,
      createdBy: uId,
      status: HackathonStatus.DRAFT,
      statusHistory: [
        {
          status: HackathonStatus.DRAFT,
          changedBy: uId,
          changedAt: new Date(),
        },
      ],
    });

    return newHackathon.save();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await this.hackathonModel.exists({ slug });
    let counter = 1;

    while (exists) {
      slug = `${baseSlug}-${counter}`;
      exists = await this.hackathonModel.exists({ slug });
      counter++;
    }

    return slug;
  }

  private validateTimeline(dto: CreateHackathonDto) {
    const startTime = new Date(dto.startTime);
    const submissionDeadline = new Date(dto.submissionDeadline);
    const now = new Date();

    if (startTime < now) {
      throw new BadRequestException('Start time must be in the future');
    }

    if (submissionDeadline <= startTime) {
      throw new BadRequestException(
        'Submission deadline must be after start time',
      );
    }

    if (dto.preRegistrationEndTime) {
      const preRegEndTime = new Date(dto.preRegistrationEndTime);
      if (preRegEndTime > startTime) {
        throw new BadRequestException(
          'Pre-registration end time must be before start time',
        );
      }
    }

    if (dto.judgingDeadline) {
      const judgingDeadline = new Date(dto.judgingDeadline);
      if (judgingDeadline <= submissionDeadline) {
        throw new BadRequestException(
          'Judging deadline must be after submission deadline',
        );
      }
    }
  }

  async findById(id: string): Promise<Hackathon> {
    let query = {};
    if (UuidUtil.validate(id)) {
      query = { uuid: id };
    } else {
      query = { _id: new Types.ObjectId(id) };
    }

    const hackathon = await this.hackathonModel.findOne(query).exec();
    if (!hackathon) {
      throw new NotFoundException(`Hackathon with ID ${id} not found`);
    }
    return hackathon;
  }

  async findBySlug(slug: string): Promise<Hackathon> {
    const hackathon = await this.hackathonModel.findOne({ slug }).exec();
    if (!hackathon) {
      throw new NotFoundException(`Hackathon with slug ${slug} not found`);
    }
    return hackathon;
  }

  async findAllByOrganization(orgId: string): Promise<Hackathon[]> {
    const oId = await this.resolveOrgId(orgId);
    return this.hackathonModel.find({ organizationId: oId }).exec();
  }

  async update(
    hackathonId: string,
    userId: string,
    updateDto: UpdateHackathonDto,
  ): Promise<Hackathon> {
    const uId = await this.resolveUserId(userId);

    // Fetch the hackathon
    let query = {};
    if (UuidUtil.validate(hackathonId)) {
      query = { uuid: hackathonId };
    } else {
      query = { _id: new Types.ObjectId(hackathonId) };
    }

    const hackathon = await this.hackathonModel.findOne(query);
    if (!hackathon) {
      throw new NotFoundException(`Hackathon with ID ${hackathonId} not found`);
    }

    // Verify user has permission to update
    const createdBy = hackathon.createdBy as any;
    const creatorId = createdBy._id || createdBy;
    const isCreator = creatorId.toString() === uId.toString();
    let hasPermission = isCreator;

    if (!isCreator) {
      // Check if user is an org admin or editor
      const organizationId = hackathon.organizationId as any;
      const orgId = organizationId._id || organizationId;
      const member = await this.membersService.getMember(
        orgId.toString(),
        userId,
      );
      hasPermission =
        !!member &&
        (member.role === MemberRole.ADMIN || member.role === MemberRole.EDITOR);
    }

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this hackathon',
      );
    }

    // Check name uniqueness if name is being changed
    if (updateDto.name && updateDto.name !== hackathon.name) {
      const organizationId = hackathon.organizationId as any;
      const orgId = organizationId._id || organizationId;
      const existing = await this.hackathonModel.findOne({
        organizationId: orgId,
        name: updateDto.name,
        _id: { $ne: hackathon._id },
      });
      if (existing) {
        throw new ConflictException(
          'A hackathon with this name already exists in your organization',
        );
      }

      // Generate new slug
      updateDto['slug'] = await this.generateUniqueSlug(updateDto.name);
    }

    // Validate timeline if any date fields are updated
    if (
      updateDto.startTime ||
      updateDto.submissionDeadline ||
      updateDto.preRegistrationEndTime ||
      updateDto.judgingDeadline
    ) {
      const timelineData = {
        startTime: updateDto.startTime || hackathon.startTime.toISOString(),
        submissionDeadline:
          updateDto.submissionDeadline ||
          hackathon.submissionDeadline.toISOString(),
        preRegistrationEndTime:
          updateDto.preRegistrationEndTime ||
          hackathon.preRegistrationEndTime?.toISOString(),
        judgingDeadline:
          updateDto.judgingDeadline || hackathon.judgingDeadline?.toISOString(),
      };
      this.validateTimeline(timelineData as any);
    }

    // Update the hackathon using set to handle nested objects properly
    Object.keys(updateDto).forEach((key) => {
      hackathon.set(key, updateDto[key]);
    });

    return hackathon.save();
  }

  /**
   * Submit a hackathon for admin review
   * Transitions from DRAFT or REJECTED to UNDER_REVIEW
   * @param hackathonId - Hackathon UUID or ObjectId
   * @param userId - User submitting (must be creator or org admin)
   * @returns Updated hackathon
   */
  async submitForReview(
    hackathonId: string,
    userId: string,
  ): Promise<Hackathon> {
    const uId = await this.resolveUserId(userId);

    // Fetch the hackathon
    let query = {};
    if (UuidUtil.validate(hackathonId)) {
      query = { uuid: hackathonId };
    } else {
      query = { _id: new Types.ObjectId(hackathonId) };
    }

    const hackathon = await this.hackathonModel.findOne(query);
    if (!hackathon) {
      throw new NotFoundException(`Hackathon with ID ${hackathonId} not found`);
    }

    // Verify user has permission (creator or org admin)
    const isCreator = hackathon.createdBy.toString() === uId.toString();
    let hasPermission = isCreator;

    if (!isCreator) {
      const member = await this.membersService.getMember(
        hackathon.organizationId.toString(),
        userId,
      );
      hasPermission = !!member && member.role === MemberRole.ADMIN;
    }

    if (!hasPermission) {
      throw new ForbiddenException(
        'Only the creator or organization admin can submit a hackathon for review',
      );
    }

    // Validate current status
    if (
      hackathon.status !== HackathonStatus.DRAFT &&
      hackathon.status !== HackathonStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot submit hackathon with status ${hackathon.status}. Only DRAFT or REJECTED hackathons can be submitted for review.`,
      );
    }

    // Update status and approval details
    hackathon.status = HackathonStatus.UNDER_REVIEW;
    hackathon.approvalDetails.submittedForReviewAt = new Date();

    // Add to status history
    hackathon.statusHistory.push({
      status: HackathonStatus.UNDER_REVIEW,
      changedBy: uId,
      changedAt: new Date(),
      reason: 'Submitted for admin review',
    } as any);

    return hackathon.save();
  }

  /**
   * List public hackathons with time-based filtering
   * @param dto - Query parameters (filter, limit, offset)
   * @returns Array of public hackathons
   */
  async listPublicHackathons(
    dto: ListPublicHackathonsDto,
  ): Promise<{ hackathons: Hackathon[]; total: number }> {
    const now = new Date();
    const query: any = {
      status: HackathonStatus.APPROVED,
      visibility: HackathonVisibility.PUBLIC,
    };

    // Apply time-based filtering
    if (dto.filter === HackathonTimeFilter.UPCOMING) {
      // Not started yet
      query.startTime = { $gt: now };
    } else if (dto.filter === HackathonTimeFilter.ONGOING) {
      // Started but before submission deadline
      query.startTime = { $lte: now };
      query.submissionDeadline = { $gte: now };
    } else if (dto.filter === HackathonTimeFilter.PAST) {
      // After submission deadline
      query.submissionDeadline = { $lt: now };
    }
    // If filter === 'all', no time filtering

    const [hackathons, total] = await Promise.all([
      this.hackathonModel
        .find(query)
        .select(
          'uuid slug name category description posterUrl prizePool prizeAsset tags startTime submissionDeadline venue status visibility organizationId createdAt updatedAt',
        )
        .sort({ startTime: 1 }) // Sort by start time ascending (soonest first)
        .skip(dto.offset || 0)
        .limit(dto.limit || 20)
        .exec(),
      this.hackathonModel.countDocuments(query),
    ]);

    return { hackathons, total };
  }

  /**
   * Get public hackathon details by slug
   * @param slug - Hackathon slug
   * @returns Full hackathon details
   */
  async findPublicBySlug(slug: string): Promise<Hackathon> {
    const hackathon = await this.hackathonModel
      .findOne({
        slug,
        status: HackathonStatus.APPROVED,
        visibility: HackathonVisibility.PUBLIC,
      })
      .exec();

    if (!hackathon) {
      throw new NotFoundException(
        `Public hackathon with slug ${slug} not found`,
      );
    }

    return hackathon;
  }
}
