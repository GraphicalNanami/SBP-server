import { Module, BadRequestException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Profile,
  ProfileSchema,
} from '@/src/modules/profiles/schemas/profile.schema';
import { ProfilesService } from '@/src/modules/profiles/profiles.service';
import { ProfilesController } from '@/src/modules/profiles/profiles.controller';
import { UsersModule } from '@/src/modules/users/users.module';
import { FileUploadService } from '@/src/modules/profiles/services/file-upload.service';
import { ExperienceModule } from '@/src/modules/experience/experience.module';
import { WalletsModule } from '@/src/modules/wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    UsersModule,
    ExperienceModule,
    WalletsModule,
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE', 5242880),
        },
        fileFilter: (req, file, callback) => {
          const allowedTypes = configService
            .get<string>(
              'ALLOWED_IMAGE_TYPES',
              'image/jpeg,image/png,image/webp',
            )
            .split(',');

          if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new BadRequestException('Invalid file type'), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, FileUploadService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
