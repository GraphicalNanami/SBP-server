import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStellarAddress } from '@/src/common/validators';

export class WalletChallengeDto {
  @ApiProperty({
    description: 'Stellar wallet address (public key)',
    example: 'GAXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
  })
  @IsNotEmpty()
  @IsString()
  @IsStellarAddress()
  walletAddress: string;
}
