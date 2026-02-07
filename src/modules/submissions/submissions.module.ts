import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { BuildsModule } from '../builds/builds.module';
import { HackathonsModule } from '../hackathons/hackathons.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Submission.name, schema: SubmissionSchema }]),
    BuildsModule,
    HackathonsModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
