import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile } from '@/modules/profiles/schemas/profile.schema';
import { UsersService } from '@/modules/users/users.service';
import { FileUploadService } from '@/modules/profiles/services/file-upload.service';
import { ExperienceService } from '@/modules/experience/experience.service';
import { WalletsService } from '@/modules/wallets/wallets.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
    private experienceService: ExperienceService,
    private walletsService: WalletsService,
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

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const pictureUrl = await this.fileUploadService.processProfilePicture(
      userId,
      file,
    );

    // Delete old picture if it exists
    if (profile.profilePictureUrl) {
      await this.fileUploadService.deleteOldPicture(profile.profilePictureUrl);
    }

    // Update profile
    profile.profilePictureUrl = pictureUrl;
    await profile.save();

    return pictureUrl;
  }

  async getCompleteProfile(userId: string): Promise<any> {
    const [user, profile, experience, wallets] = await Promise.all([
      this.usersService.findById(userId),
      this.findByUserId(userId),
      this.experienceService.findByUserId(userId),
      this.walletsService.findByUserId(userId),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      profile: profile || {},
      experience: experience || null,
      wallets: wallets || [],
    };
  }
}
