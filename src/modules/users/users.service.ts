import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/src/modules/users/schemas/user.schema';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';
import { UuidUtil } from '@/src/common/utils/uuid.util';
import { UsersListQueryDto } from '@/src/modules/users/dto/users-list-query.dto';
import { UsersListResponseDto, UserListItemDto } from '@/src/modules/users/dto/users-list-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find user by email prefix (username)
   * Searches for a user whose email starts with the given prefix followed by '@'
   * Used for public profile lookup by username
   */
  async findByEmailPrefix(prefix: string): Promise<User | null> {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.userModel
      .findOne({ email: new RegExp(`^${escapedPrefix}@`, 'i') })
      .exec();
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
  async createWalletUser(name: string): Promise<User> {
    const newUser = new this.userModel({
      email: null,
      password: null,
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

  /**
   * Get paginated list of users with public information
   * No authentication required - public directory
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of users with public information
   */
  async getUsersList(query: UsersListQueryDto): Promise<UsersListResponseDto> {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Build match query
    const matchQuery: any = {};

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchQuery.$or = [
        { email: searchRegex },
        { name: searchRegex },
      ];
    }

    // Role filter
    if (role) {
      matchQuery.role = role;
    }

    // Build sort object
    const sortField = sortBy === 'joinedAt' ? 'createdAt' : sortBy;
    const sortObject: any = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // Get total count
    const total = await this.userModel.countDocuments(matchQuery);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch users with aggregation to join profile data
    const users = await this.userModel.aggregate([
      { $match: matchQuery },
      { $sort: sortObject },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          uuid: 1,
          email: 1,
          name: 1,
          role: 1,
          createdAt: 1,
          'profile.bio': 1,
          'profile.city': 1,
          'profile.country': 1,
          'profile.profilePictureUrl': 1,
          'profile.stellarAddress': 1,
        },
      },
    ]);

    // Build API URL for profile pictures
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';

    // Map to UserListItemDto
    const userItems: UserListItemDto[] = users.map((user) => {
      const bio = user.profile?.bio;
      const truncatedBio = bio && bio.length > 150 ? `${bio.substring(0, 150)}...` : bio;

      const location = [user.profile?.city, user.profile?.country]
        .filter(Boolean)
        .join(', ');

      const profilePictureUrl = user.profile?.profilePictureUrl
        ? `${apiUrl}/${user.profile.profilePictureUrl}`
        : undefined;

      return {
        uuid: user.uuid,
        username: user.email?.split('@')[0], // Temporary until username field exists
        name: user.name,
        profilePicture: profilePictureUrl,
        bio: truncatedBio,
        location: location || undefined,
        role: user.role,
        joinedAt: user.createdAt?.toISOString() || new Date().toISOString(),
        verified: !!user.profile?.stellarAddress, // Has verified stellar address
      };
    });

    return {
      users: userItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
