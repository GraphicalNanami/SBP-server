import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Experience, ExperienceSchema } from '@/src/modules/experience/schemas/experience.schema';
import { ExperienceService } from '@/src/modules/experience/experience.service';
import { ExperienceController } from '@/src/modules/experience/experience.controller';
import { UsersModule } from '@/src/modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experience.name, schema: ExperienceSchema },
    ]),
    UsersModule,
  ],
  controllers: [ExperienceController],
  providers: [ExperienceService],
  exports: [ExperienceService],
})
export class ExperienceModule {}
