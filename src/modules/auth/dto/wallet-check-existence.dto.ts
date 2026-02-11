import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStellarAddress } from '@/src/common/validators';

export class WalletCheckExistenceDto {
  @ApiProperty({
    description: 'Stellar wallet address (public key) to check for registration',
    example: 'GAXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
  })
  @IsNotEmpty()
  @IsString()
  @IsStellarAddress()
  walletAddress: string;
}
