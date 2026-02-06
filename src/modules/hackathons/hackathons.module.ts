import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { Hackathon, HackathonSchema } from './schemas/hackathon.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { HackathonRoleGuard } from './guards/hackathon-role.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hackathon.name, schema: HackathonSchema },
    ]),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [HackathonsController],
  providers: [HackathonsService, HackathonRoleGuard],
  exports: [HackathonsService],
})
export class HackathonsModule {}
