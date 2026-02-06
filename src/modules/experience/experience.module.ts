import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Experience, ExperienceSchema } from '@/modules/experience/schemas/experience.schema';
import { ExperienceService } from '@/modules/experience/experience.service';
import { ExperienceController } from '@/modules/experience/experience.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experience.name, schema: ExperienceSchema },
    ]),
  ],
  controllers: [ExperienceController],
  providers: [ExperienceService],
  exports: [ExperienceService],
})
export class ExperienceModule {}
