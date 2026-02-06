import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { UsersModule } from '@/modules/users/users.module';
import { ProfilesModule } from '@/modules/profiles/profiles.module';
// import { GithubStrategy } from '@/modules/auth/strategies/github.strategy';
// import { GoogleStrategy } from '@/modules/auth/strategies/google.strategy';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

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
