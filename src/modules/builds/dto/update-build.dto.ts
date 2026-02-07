import { PartialType } from '@nestjs/swagger';
import { CreateBuildDto } from './create-build.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateBuildDto extends PartialType(CreateBuildDto) {
  @ApiProperty({ example: 'C...', required: false, description: 'Soroban Contract Address' })
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @ApiProperty({ example: 'G...', required: false, description: 'Stellar Public Key' })
  @IsString()
  @IsOptional()
  stellarAddress?: string;
}
