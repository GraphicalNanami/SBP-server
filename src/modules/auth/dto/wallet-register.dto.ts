import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStellarAddress } from '@/src/common/validators';

export class WalletRegisterDto {
  @ApiProperty({
    description: 'Stellar wallet address (public key)',
    example: 'GAXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
  })
  @IsNotEmpty()
  @IsString()
  @IsStellarAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Base64 encoded signature of the challenge message',
    example: 'aGVsbG8gd29ybGQgc2lnbmF0dXJlIGV4YW1wbGU=',
  })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Challenge string received from /auth/wallet/challenge endpoint',
    example: 'Sign this message to authenticate with Stellar Build Portal: abc123:1707580800000',
  })
  @IsNotEmpty()
  @IsString()
  challenge: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}
