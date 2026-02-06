import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from '@/src/modules/organizations/organizations.controller';
import { OrganizationsService } from '@/src/modules/organizations/organizations.service';
import { MembersController } from '@/src/modules/organizations/members.controller';
import { MembersService } from '@/src/modules/organizations/members.service';
import {
  Organization,
  OrganizationSchema,
} from '@/src/modules/organizations/schemas/organization.schema';
import {
  OrganizationMember,
  OrganizationMemberSchema,
} from '@/src/modules/organizations/schemas/organization-member.schema';
import { UsersModule } from '@/src/modules/users/users.module';
import { OrganizationRoleGuard } from '@/src/modules/organizations/guards/organization-role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
    ]),
    UsersModule,
  ],
  controllers: [OrganizationsController, MembersController],
  providers: [OrganizationsService, MembersService, OrganizationRoleGuard],
  exports: [OrganizationsService, MembersService],
})
export class OrganizationsModule {}
