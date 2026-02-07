import { IsString, IsNotEmpty, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BuildVisibility } from '../enums/build-visibility.enum';

export class PublishBuildDto {
  @ApiProperty({ example: 'C...', description: 'Soroban Contract Address (starts with C, 56 chars)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^C[A-Z0-9]{55}$/, { message: 'Invalid Soroban Contract Address' })
  contractAddress: string;

  @ApiProperty({ example: 'G...', description: 'Stellar Public Key (starts with G, 56 chars)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z0-9]{55}$/, { message: 'Invalid Stellar Public Key' })
  stellarAddress: string;

  @ApiProperty({ enum: BuildVisibility, default: BuildVisibility.PUBLIC, required: false })
  @IsEnum(BuildVisibility)
  @IsOptional()
  visibility?: BuildVisibility;
}
