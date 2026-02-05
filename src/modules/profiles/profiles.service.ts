import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile } from './schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async findByUserId(userId: string | Types.ObjectId): Promise<Profile | null> {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.profileModel.findOne({ userId: id }).exec();
  }

  async create(profileData: Partial<Profile>): Promise<Profile> {
    const newProfile = new this.profileModel(profileData);
    return newProfile.save();
  }

  async update(
    userId: string | Types.ObjectId,
    updateData: Partial<Profile>,
  ): Promise<Profile | null> {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.profileModel
      .findOneAndUpdate({ userId: id }, updateData, { new: true })
      .exec();
  }
}
