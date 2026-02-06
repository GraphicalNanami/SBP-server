import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { validate } from '@/src/src/config/env.validation';
import { AppController } from '@/src/src/app.controller';
import { AppService } from '@/src/src/app.service';
import { AuthModule } from '@/src/src/modules/auth/auth.module';
import { UsersModule } from '@/src/src/modules/users/users.module';
import { ProfilesModule } from '@/src/src/modules/profiles/profiles.module';
import { RedisModule } from '@/src/src/database/redis/redis.module';
import { OrganizationsModule } from '@/src/src/modules/organizations/organizations.module';
import { ExperienceModule } from '@/src/src/modules/experience/experience.module';
import { WalletsModule } from '@/src/src/modules/wallets/wallets.module';

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
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(process.cwd(), configService.get<string>('UPLOAD_DIR', './uploads')),
          serveRoot: '/uploads',
        },
      ],
      inject: [ConfigService],
    }),
    RedisModule,
    UsersModule,
    ProfilesModule,
    AuthModule,
    OrganizationsModule,
    ExperienceModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
