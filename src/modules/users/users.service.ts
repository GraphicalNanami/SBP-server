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
}
