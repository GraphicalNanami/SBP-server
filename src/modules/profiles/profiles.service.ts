import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile } from '@/src/modules/profiles/schemas/profile.schema';
import { UsersService } from '@/src/modules/users/users.service';
import { FileUploadService } from '@/src/modules/profiles/services/file-upload.service';
import { ExperienceService } from '@/src/modules/experience/experience.service';
import { WalletsService } from '@/src/modules/wallets/wallets.service';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    private usersService: UsersService,
    private fileUploadService: FileUploadService,
    private experienceService: ExperienceService,
    private walletsService: WalletsService,
  ) {}

  async findByUuid(uuid: string): Promise<Profile | null> {
    return this.profileModel.findOne({ uuid }).exec();
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<Profile | null> {
    let id: Types.ObjectId;

    if (typeof userId === 'string') {
      if (UuidUtil.validate(userId)) {
        // Resolve UUID to User ObjectId
        const user = await this.usersService.findByUuid(userId);
        if (!user) return null;
        id = user._id as Types.ObjectId;
      } else if (Types.ObjectId.isValid(userId)) {
        id = new Types.ObjectId(userId);
      } else {
         // Invalid format
         return null; 
      }
    } else {
      id = userId;
    }

    return this.profileModel.findOne({ userId: id }).exec();
  }

  @LogInteraction()
  async create(profileData: Partial<Profile>): Promise<Profile> {
    const newProfile = new this.profileModel(profileData);
    return newProfile.save();
  }

  @LogInteraction()
  async update(
    userId: string | Types.ObjectId,
    updateData: Partial<Profile>,
  ): Promise<Profile | null> {
    // findByUserId handles the resolution logic now, but we need the ID for update
    // We can't reuse findByUserId directly for updateOne, but we can resolve the ID first.
    
    let id: Types.ObjectId;
    if (typeof userId === 'string') {
       if (UuidUtil.validate(userId)) {
          const user = await this.usersService.findByUuid(userId);
          if (!user) return null; // Or throw NotFound
          id = user._id as Types.ObjectId;
       } else if (Types.ObjectId.isValid(userId)) {
          id = new Types.ObjectId(userId);
       } else {
          return null;
       }
    } else {
       id = userId;
    }

    return this.profileModel
      .findOneAndUpdate({ userId: id }, updateData, { new: true })
      .exec();
  }

  @LogInteraction()
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

  @LogInteraction()
  async getCompleteProfile(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // We can use the resolved user._id to fetch related data
    // assuming other services also expect userId (which might be UUID or ObjectId)
    // But since we have the user object, we can pass user._id to be safe and efficient if they support it, 
    // OR pass the original userId (UUID) if they are updated to handle it.
    // The plan says "Update all wallet operations... Update findByUserId...".
    // If I pass UUID to them, they should handle it.
    
    // However, for consistency and performance (avoiding re-lookup), 
    // if I have the ObjectId, I could use it if the other services support it.
    // But other services are also being updated to support UUID.
    
    // Let's rely on the services handling the ID passed to them. 
    // BUT, I'm passing `userId` which comes from the controller.
    
    const [profile, experience, wallets] = await Promise.all([
      this.findByUserId(userId), // Handles UUID
      this.experienceService.findByUserId(userId), // Needs update
      this.walletsService.findByUserId(userId), // Needs update
    ]);

    return {
      user: {
        uuid: user.uuid,
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


