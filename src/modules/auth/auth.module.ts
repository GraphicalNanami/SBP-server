import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
// import { GithubStrategy } from './strategies/github.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    ProfilesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_ACCESS_TTL'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, /*GithubStrategy, GoogleStrategy,*/ JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
