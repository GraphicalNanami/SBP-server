import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { hash, compare } from 'bcrypt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { RedisService } from '../../database/redis/redis.service';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private profilesService: ProfilesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Hash password
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 10;
    const hashedPassword = await hash(password, bcryptRounds);

    // Create user (UsersService handles duplicate check)
    const user = await this.usersService.create(email, hashedPassword, name);

    // Create profile for new user
    await this.profilesService.create({
      userId: new Types.ObjectId(user._id),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password - type assertion needed because password has select: false
    const userWithPassword = user as User & { password: string };
    const isPasswordValid = await compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user._id.toString());

    return {
      accessToken,
      refreshToken,
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

    // Rotate refresh token
    await this.redisService.del(`refresh:${tokenHash}`);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redisService.del(`refresh:${tokenHash}`);
  }
}
