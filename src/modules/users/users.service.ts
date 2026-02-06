import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/src/modules/users/schemas/user.schema';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.userModel.findOne({ uuid }).exec();
  }

  async findById(id: string): Promise<User | null> {
    // Try UUID first (new approach)
    if (UuidUtil.validate(id)) {
      return this.findByUuid(id);
    }
    // Fallback to ObjectId (backwards compatibility)
    return this.userModel.findById(id).exec();
  }

  @LogInteraction()
  async create(
    email: string,
    hashedPassword: string,
    name: string,
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      name,
    });

    return newUser.save();
  }

  @LogInteraction()
  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  /**
   * Search users by email or name (partial match)
   * Used for invitations and user discovery
   * @param query - search term (email or name)
   * @param limit - maximum number of results (default: 10, max: 50)
   * @returns Array of users matching the search criteria
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    return this.userModel
      .find({
        $or: [{ email: searchRegex }, { name: searchRegex }],
      })
      .select('uuid email name avatar role')
      .limit(Math.min(limit, 50)) // Enforce max limit
      .exec();
  }
}
