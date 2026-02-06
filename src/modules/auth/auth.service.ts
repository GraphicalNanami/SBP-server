import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { hash, compare } from 'bcrypt';
import { Types } from 'mongoose';
import { UsersService } from '@/src/modules/users/users.service';
import { ProfilesService } from '@/src/modules/profiles/profiles.service';
import { RedisService } from '@/src/database/redis/redis.service';
import { User } from '@/src/modules/users/schemas/user.schema';
import { RegisterDto } from '@/src/modules/auth/dto/register.dto';
import { LoginDto } from '@/src/modules/auth/dto/login.dto';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private profilesService: ProfilesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @LogInteraction()
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Hash password
    const bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    const hashedPassword = await hash(password, bcryptRounds);

    // Create user (UsersService handles duplicate check)
    const user = await this.usersService.create(email, hashedPassword, name);

    // Create profile for new user
    await this.profilesService.create({
      userId: user._id,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @LogInteraction()
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
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.uuid,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.uuid);

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

  @LogInteraction()
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
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @LogInteraction()
  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redisService.del(`refresh:${tokenHash}`);
  }
}
