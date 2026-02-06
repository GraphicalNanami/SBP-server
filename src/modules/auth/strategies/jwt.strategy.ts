import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/src/modules/users/users.service';
import { UuidUtil } from '@/src/common/utils/uuid.util';
import { User } from '@/src/modules/users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: any) {
    let user: User | null;

    // Try UUID first (new tokens)
    if (UuidUtil.validate(payload.sub)) {
      user = await this.usersService.findByUuid(payload.sub);
    } else {
      // Fallback for old tokens
      user = await this.usersService.findById(payload.sub);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
