import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class AddWalletDto {
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'Invalid Stellar public key format',
  })
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class VerifyWalletDto {
  @IsString()
  signature: string;

  @IsString()
  challenge: string;
}

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class WalletResponseDto {
  _id: string;
  address: string;
  nickname?: string;
  isPrimary: boolean;
  isVerified: boolean;
  addedAt: Date;
  lastUsedAt?: Date;
}
