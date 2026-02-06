import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from '@/modules/wallets/schemas/wallet.schema';
import { WalletsService } from '@/modules/wallets/wallets.service';
import { WalletsController } from '@/modules/wallets/wallets.controller';
import { StellarVerificationService } from '@/modules/wallets/services/stellar-verification.service';
import { RedisModule } from '@/database/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    RedisModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, StellarVerificationService],
  exports: [WalletsService],
})
export class WalletsModule {}
