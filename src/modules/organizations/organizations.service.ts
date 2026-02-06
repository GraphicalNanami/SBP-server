import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Organization } from '@/src/modules/organizations/schemas/organization.schema';
import { OrganizationMember } from '@/src/modules/organizations/schemas/organization-member.schema';
import { CreateOrganizationDto } from '@/src/modules/organizations/dto/create-organization.dto';
import { UpdateOrganizationProfileDto } from '@/src/modules/organizations/dto/update-organization-profile.dto';
import { UpdateSocialLinksDto } from '@/src/modules/organizations/dto/update-social-links.dto';
import { MemberRole } from '@/src/modules/organizations/enums/member-role.enum';
import { MemberStatus } from '@/src/modules/organizations/enums/member-status.enum';
import { OrganizationStatus } from '@/src/modules/organizations/enums/organization-status.enum';
import { UsersService } from '@/src/modules/users/users.service';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMember>,
    private usersService: UsersService,
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

  async create(
    userId: string,
    createDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const uId = await this.resolveUserId(userId);

    if (!createDto.agreeToTerms) {
      throw new BadRequestException('You must agree to the terms of service');
    }

    const existingName = await this.organizationModel.findOne({
      name: createDto.name,
    });
    if (existingName) {
      throw new ConflictException('Organization name already exists');
    }

    let slug = slugify(createDto.name, { lower: true, strict: true });
    let slugExists = await this.organizationModel.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      const newSlug = `${slug}-${counter}`;
      slugExists = await this.organizationModel.findOne({ slug: newSlug });
      if (!slugExists) {
        slug = newSlug;
      }
      counter++;
    }

    const organization = new this.organizationModel({
      ...createDto,
      slug,
      createdBy: uId,
      termsAcceptedAt: new Date(),
      termsVersion: process.env.ORG_TERMS_VERSION || 'v1.0',
      status: OrganizationStatus.ACTIVE,
    });

    const savedOrg = await organization.save();

    const member = new this.memberModel({
      organizationId: savedOrg._id,
      userId: uId,
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
      invitedBy: uId,
      joinedAt: new Date(),
    });

    await member.save();

    return savedOrg;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.organizationModel
      .findOne({ slug })
      .populate('createdBy', 'name email avatar');
    if (!org) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }
    return org;
  }

  async findById(id: string): Promise<Organization> {
    let org;
    if (UuidUtil.validate(id)) {
      org = await this.organizationModel
        .findOne({ uuid: id })
        .populate('createdBy', 'name email avatar');
    } else {
      org = await this.organizationModel
        .findById(id)
        .populate('createdBy', 'name email avatar');
    }

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async findUserOrganizations(userId: string) {
    const uId = await this.resolveUserId(userId);

    const memberships = await this.memberModel
      .find({ userId: uId, status: MemberStatus.ACTIVE })
      .populate('organizationId')
      .exec();

    return memberships.map((m) => ({
      organization: m.organizationId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async updateProfile(
    orgId: string,
    updateDto: UpdateOrganizationProfileDto,
  ): Promise<Organization> {
    let query: any;
    if (UuidUtil.validate(orgId)) {
      query = { uuid: orgId };
    } else {
      query = { _id: orgId };
    }

    const org = await this.organizationModel.findOneAndUpdate(
      query,
      { $set: updateDto },
      { new: true },
    );
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async updateSocialLinks(
    orgId: string,
    updateDto: UpdateSocialLinksDto,
  ): Promise<Organization> {
    let query: any;
    if (UuidUtil.validate(orgId)) {
      query = { uuid: orgId };
    } else {
      query = { _id: orgId };
    }

    const org = await this.organizationModel.findOneAndUpdate(
      query,
      { $set: { socialLinks: updateDto } },
      { new: true },
    );
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }
}
