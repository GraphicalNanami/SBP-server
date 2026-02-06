import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemberParamsDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization UUID',
  })
  @IsUUID(4, { message: 'Invalid Organization UUID format' })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Member UUID (User ID)',
  })
  @IsUUID(4, { message: 'Invalid Member UUID format' })
  memberId: string;
}
