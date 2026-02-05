import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Organization } from './schemas/organization.schema';
import { OrganizationMember } from './schemas/organization-member.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { MemberRole } from './enums/member-role.enum';
import { MemberStatus } from './enums/member-status.enum';
import { OrganizationStatus } from './enums/organization-status.enum';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMember>,
  ) {}

  async create(
    userId: string,
    createDto: CreateOrganizationDto,
  ): Promise<Organization> {
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
      createdBy: userId,
      termsAcceptedAt: new Date(),
      termsVersion: process.env.ORG_TERMS_VERSION || 'v1.0',
      status: OrganizationStatus.ACTIVE,
    });

    const savedOrg = await organization.save();

    const member = new this.memberModel({
      organizationId: savedOrg._id,
      userId,
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
      invitedBy: userId,
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
    const org = await this.organizationModel
      .findById(id)
      .populate('createdBy', 'name email avatar');
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async findUserOrganizations(userId: string) {
    const memberships = await this.memberModel
      .find({ userId, status: MemberStatus.ACTIVE })
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
    const org = await this.organizationModel.findByIdAndUpdate(
      orgId,
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
    const org = await this.organizationModel.findByIdAndUpdate(
      orgId,
      { $set: { socialLinks: updateDto } },
      { new: true },
    );
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }
}
