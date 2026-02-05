import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { RedisService } from '../../database/redis/redis.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private profilesService: ProfilesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(
    provider: string,
    providerId: string,
    email: string,
    name: string,
    avatar: string,
  ): Promise<User> {
    let user = await this.usersService.findByProviderId(provider, providerId);

    if (!user) {
      // Check if user exists by email (if email is provided)
      if (email) {
        user = await this.usersService.findByEmail(email);
      }

      if (!user) {
        // Create new user
        user = await this.usersService.create({
          provider,
          providerId,
          email,
          name,
          avatar,
        });

        // Create profile for new user
        await this.profilesService.create({
          userId: new Types.ObjectId(user._id),
        });
      } else {
        // Update existing user with provider info if it matches email
        user = await this.usersService.update(user._id.toString(), {
          provider,
          providerId,
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user._id.toString());

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const ttl = this.configService.get<number>('JWT_REFRESH_TTL');

    await this.redisService.set(`refresh:${tokenHash}`, userId, ttl);

    return token;
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const userId = await this.redisService.get(`refresh:${tokenHash}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Optional: Rotate refresh token
    await this.redisService.del(`refresh:${tokenHash}`);

    return this.login(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redisService.del(`refresh:${tokenHash}`);
  }
}
