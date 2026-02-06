import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from '@/modules/wallets/schemas/wallet.schema';
import { StellarVerificationService } from '@/modules/wallets/services/stellar-verification.service';
import { AddWalletDto, UpdateWalletDto } from '@/modules/wallets/dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private stellarVerificationService: StellarVerificationService,
  ) {}

  async findByUserId(userId: string | Types.ObjectId): Promise<Wallet[]> {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.walletModel.find({ userId: id }).exec();
  }

  async findById(walletId: string): Promise<Wallet | null> {
    return this.walletModel.findById(walletId).exec();
  }

  async addWallet(
    userId: string,
    data: AddWalletDto,
  ): Promise<{ wallet: Wallet; challenge: string }> {
    const existingWallet = await this.walletModel.findOne({
      address: data.address,
    });
    if (existingWallet) {
      throw new ConflictException('Wallet address already registered');
    }

    const wallet = new this.walletModel({
      userId: new Types.ObjectId(userId),
      address: data.address,
      nickname: data.nickname,
      isPrimary: false,
      isVerified: false,
    });

    await wallet.save();
    const challenge = await this.stellarVerificationService.generateChallenge(
      wallet._id.toString(),
    );

    return { wallet, challenge };
  }

  async verifyWallet(
    userId: string,
    walletId: string,
    signature: string,
    challenge: string,
  ): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const isVerified = await this.stellarVerificationService.verifySignature(
      wallet.address,
      signature,
      challenge,
      walletId,
    );

    if (!isVerified) {
      throw new BadRequestException('Signature verification failed');
    }

    wallet.isVerified = true;
    return wallet.save();
  }

  async updateWallet(
    userId: string,
    walletId: string,
    data: UpdateWalletDto,
  ): Promise<Wallet> {
    const wallet = await this.walletModel.findOneAndUpdate(
      { _id: new Types.ObjectId(walletId), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true },
    );

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async removeWallet(userId: string, walletId: string): Promise<void> {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.isPrimary) {
      throw new BadRequestException(
        'Cannot delete primary wallet. Set another wallet as primary first.',
      );
    }

    await wallet.deleteOne();
  }

  async setPrimary(userId: string, walletId: string): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.isVerified) {
      throw new BadRequestException('Only verified wallets can be set as primary');
    }

    // Atomic update to unset other primary wallets and set the new one
    await this.walletModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { isPrimary: false } },
    );

    wallet.isPrimary = true;
    return wallet.save();
  }
}
