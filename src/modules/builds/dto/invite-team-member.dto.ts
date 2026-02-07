import { IsEmail, IsNotEmpty, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TeamMemberRole } from '../enums/team-member-role.enum';
import { BuildPermissionsDto } from './build-permissions.dto';

export class InviteTeamMemberDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: TeamMemberRole, default: TeamMemberRole.MEMBER, required: false })
  @IsEnum(TeamMemberRole)
  @IsOptional()
  role?: TeamMemberRole;

  @ApiProperty({ type: BuildPermissionsDto, required: false })
  @ValidateNested()
  @Type(() => BuildPermissionsDto)
  @IsOptional()
  permissions?: BuildPermissionsDto;
}
