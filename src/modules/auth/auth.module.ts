import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from '@/src/modules/auth/auth.service';
import { AuthController } from '@/src/modules/auth/auth.controller';
import { UsersModule } from '@/src/modules/users/users.module';
import { ProfilesModule } from '@/src/modules/profiles/profiles.module';
import { WalletsModule } from '@/src/modules/wallets/wallets.module';
// import { GithubStrategy } from '@/src/modules/auth/strategies/github.strategy';
// import { GoogleStrategy } from '@/src/modules/auth/strategies/google.strategy';
import { JwtStrategy } from '@/src/modules/auth/strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    ProfilesModule,
    WalletsModule,
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
