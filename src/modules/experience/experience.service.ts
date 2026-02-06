import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experience } from '@/src/modules/experience/schemas/experience.schema';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
} from '@/src/modules/experience/dto/experience.dto';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';
import { UsersService } from '@/src/modules/users/users.service';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class ExperienceService {
  private readonly logger = new Logger(ExperienceService.name);

  constructor(
    @InjectModel(Experience.name) private experienceModel: Model<Experience>,
    private usersService: UsersService,
  ) {}

  async findByUserId(
    userId: string | Types.ObjectId,
  ): Promise<Experience | null> {
    let id: Types.ObjectId;

    if (typeof userId === 'string') {
      if (UuidUtil.validate(userId)) {
        const user = await this.usersService.findByUuid(userId);
        if (!user) return null;
        id = user._id;
      } else if (Types.ObjectId.isValid(userId)) {
        id = new Types.ObjectId(userId);
      } else {
        return null;
      }
    } else {
      id = userId;
    }
    return this.experienceModel.findOne({ userId: id }).exec();
  }

  @LogInteraction()
  async upsert(userId: string, data: CreateExperienceDto): Promise<Experience> {
    let id: Types.ObjectId;
    if (UuidUtil.validate(userId)) {
      const user = await this.usersService.findByUuid(userId);
      if (!user) throw new Error('User not found'); // Should be handled by guard/controller usually
      id = user._id;
    } else {
      id = new Types.ObjectId(userId);
    }

    return this.experienceModel
      .findOneAndUpdate(
        { userId: id },
        { ...data, userId: id },
        { upsert: true, new: true },
      )
      .exec();
  }

  @LogInteraction()
  async update(userId: string, data: UpdateExperienceDto): Promise<Experience> {
    let id: Types.ObjectId;
    if (UuidUtil.validate(userId)) {
      const user = await this.usersService.findByUuid(userId);
      if (!user) throw new Error('User not found');
      id = user._id;
    } else {
      id = new Types.ObjectId(userId);
    }

    const updateQuery: any = {};
    const addToSet: any = {};
    const pull: any = {};

    if (data.yearsOfExperience !== undefined)
      updateQuery.yearsOfExperience = data.yearsOfExperience;
    if (data.web3SkillLevel !== undefined)
      updateQuery.web3SkillLevel = data.web3SkillLevel;

    if (data.addRoles) addToSet.roles = { $each: data.addRoles };
    if (data.removeRoles) pull.roles = { $in: data.removeRoles };

    if (data.addLanguages)
      addToSet.programmingLanguages = { $each: data.addLanguages };
    if (data.removeLanguages)
      pull.programmingLanguages = { $in: data.removeLanguages };

    if (data.addTools) addToSet.developerTools = { $each: data.addTools };
    if (data.removeTools) pull.developerTools = { $in: data.removeTools };

    const update: any = { $set: updateQuery };
    if (Object.keys(addToSet).length > 0) update.$addToSet = addToSet;
    if (Object.keys(pull).length > 0) update.$pull = pull;

    return this.experienceModel
      .findOneAndUpdate({ userId: id }, update, {
        upsert: true,
        new: true,
      })
      .exec();
  }
}
