import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RedisModule } from './database/redis/redis.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { HackathonsModule } from './modules/hackathons/hackathons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    UsersModule,
    ProfilesModule,
    AuthModule,
    OrganizationsModule,
    HackathonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
