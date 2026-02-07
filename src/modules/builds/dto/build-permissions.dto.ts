import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuildPermissionsDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  canInvite?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  canSubmit?: boolean;
}
