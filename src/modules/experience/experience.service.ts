import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experience } from '@/modules/experience/schemas/experience.schema';
import { CreateExperienceDto, UpdateExperienceDto } from '@/modules/experience/dto/experience.dto';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectModel(Experience.name) private experienceModel: Model<Experience>,
  ) {}

  async findByUserId(userId: string | Types.ObjectId): Promise<Experience | null> {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.experienceModel.findOne({ userId: id }).exec();
  }

  async upsert(userId: string, data: CreateExperienceDto): Promise<Experience> {
    return this.experienceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { ...data, userId: new Types.ObjectId(userId) },
        { upsert: true, new: true },
      )
      .exec();
  }

  async update(userId: string, data: UpdateExperienceDto): Promise<Experience> {
    const experience = await this.findByUserId(userId);
    const updateQuery: any = {};
    const addToSet: any = {};
    const pull: any = {};

    if (data.yearsOfExperience !== undefined) updateQuery.yearsOfExperience = data.yearsOfExperience;
    if (data.web3SkillLevel !== undefined) updateQuery.web3SkillLevel = data.web3SkillLevel;

    if (data.addRoles) addToSet.roles = { $each: data.addRoles };
    if (data.removeRoles) pull.roles = { $in: data.removeRoles };

    if (data.addLanguages) addToSet.programmingLanguages = { $each: data.addLanguages };
    if (data.removeLanguages) pull.programmingLanguages = { $in: data.removeLanguages };

    if (data.addTools) addToSet.developerTools = { $each: data.addTools };
    if (data.removeTools) pull.developerTools = { $in: data.removeTools };

    const update: any = { $set: updateQuery };
    if (Object.keys(addToSet).length > 0) update.$addToSet = addToSet;
    if (Object.keys(pull).length > 0) update.$pull = pull;

    return this.experienceModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, update, {
        upsert: true,
        new: true,
      })
      .exec();
  }
}
