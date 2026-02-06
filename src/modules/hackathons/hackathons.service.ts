import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Hackathon } from './schemas/hackathon.schema';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { MembersService } from '../organizations/members.service';
import { HackathonStatus } from './enums/hackathon-status.enum';

@Injectable()
export class HackathonsService {
  constructor(
    @InjectModel(Hackathon.name) private hackathonModel: Model<Hackathon>,
    private membersService: MembersService,
  ) {}

  async create(userId: string, createDto: CreateHackathonDto): Promise<Hackathon> {
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
      organizationId: createDto.organizationId,
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
      slug,
      createdBy: userId,
      status: HackathonStatus.DRAFT,
      statusHistory: [
        {
          status: HackathonStatus.DRAFT,
          changedBy: userId,
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
      throw new BadRequestException('Submission deadline must be after start time');
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
    const hackathon = await this.hackathonModel.findById(id).exec();
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
    return this.hackathonModel.find({ organizationId: orgId }).exec();
  }
}
