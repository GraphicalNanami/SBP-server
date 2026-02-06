import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({
    example: 'some-refresh-token',
    description: 'The refresh token to generate a new access token',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
