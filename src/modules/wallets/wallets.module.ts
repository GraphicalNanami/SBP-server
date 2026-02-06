import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Wallet,
  WalletSchema,
} from '@/src/modules/wallets/schemas/wallet.schema';
import { WalletsService } from '@/src/modules/wallets/wallets.service';
import { WalletsController } from '@/src/modules/wallets/wallets.controller';
import { StellarVerificationService } from '@/src/modules/wallets/services/stellar-verification.service';
import { RedisModule } from '@/src/database/redis/redis.module';
import { UsersModule } from '@/src/modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    RedisModule,
    UsersModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService, StellarVerificationService],
  exports: [WalletsService],
})
export class WalletsModule {}
