import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TeamMemberRole } from '../enums/team-member-role.enum';
import { BuildPermissionsDto } from './build-permissions.dto';

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: TeamMemberRole, required: false })
  @IsEnum(TeamMemberRole)
  @IsOptional()
  role?: TeamMemberRole;

  @ApiProperty({ type: BuildPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => BuildPermissionsDto)
  @IsOptional()
  permissions?: BuildPermissionsDto;
}
