import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWalletDto {
  @ApiProperty({
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    description: 'Stellar public key',
  })
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'Invalid Stellar public key format',
  })
  address: string;

  @ApiProperty({
    example: 'Main Wallet',
    description: 'Wallet nickname',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class VerifyWalletDto {
  @ApiProperty({
    example: 'base64signature',
    description: 'Signature of the challenge',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    example: 'challengeString',
    description: 'Challenge string that was signed',
  })
  @IsString()
  challenge: string;
}

export class UpdateWalletDto {
  @ApiProperty({
    example: 'Savings Wallet',
    description: 'New wallet nickname',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class WalletResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Wallet UUID',
  })
  _id: string;

  @ApiProperty({
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    description: 'Stellar public key',
  })
  address: string;

  @ApiProperty({
    example: 'Main Wallet',
    description: 'Wallet nickname',
    required: false,
  })
  nickname?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the primary wallet',
  })
  isPrimary: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the wallet ownership is verified',
  })
  isVerified: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'When the wallet was added',
  })
  addedAt: Date;

  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'When the wallet was last used',
    required: false,
  })
  lastUsedAt?: Date;
}
