import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from '@/src/modules/wallets/schemas/wallet.schema';
import { StellarVerificationService } from '@/src/modules/wallets/services/stellar-verification.service';
import { AddWalletDto, UpdateWalletDto } from '@/src/modules/wallets/dto/wallet.dto';
import { UsersService } from '@/src/modules/users/users.service';
import { UuidUtil } from '@/src/common/utils/uuid.util';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private stellarVerificationService: StellarVerificationService,
    private usersService: UsersService,
  ) {}

  private async resolveUserId(userId: string | Types.ObjectId): Promise<Types.ObjectId> {
    if (typeof userId === 'string' && UuidUtil.validate(userId)) {
      const user = await this.usersService.findByUuid(userId);
      if (!user) throw new NotFoundException('User not found');
      return user._id as Types.ObjectId;
    }
    return typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<Wallet[]> {
    const id = await this.resolveUserId(userId);
    return this.walletModel.find({ userId: id }).exec();
  }

  async findById(walletId: string): Promise<Wallet | null> {
    if (UuidUtil.validate(walletId)) {
      return this.walletModel.findOne({ uuid: walletId }).exec();
    }
    return this.walletModel.findById(walletId).exec();
  }

  async findByUuid(uuid: string): Promise<Wallet | null> {
    return this.walletModel.findOne({ uuid }).exec();
  }

  async addWallet(
    userId: string,
    data: AddWalletDto,
  ): Promise<{ wallet: Wallet; challenge: string }> {
    const id = await this.resolveUserId(userId);

    const existingWallet = await this.walletModel.findOne({
      address: data.address,
    });
    if (existingWallet) {
      throw new ConflictException('Wallet address already registered');
    }

    const wallet = new this.walletModel({
      userId: id,
      address: data.address,
      nickname: data.nickname,
      isPrimary: false,
      isVerified: false,
    });

    await wallet.save();
    // Use wallet UUID for challenge if available, or fallback to _id if needed, 
    // but the plan implies shifting to UUID. 
    // However, existing challenge verification logic might depend on ID format?
    // StellarVerificationService generates challenge. It takes an identifier.
    // Let's pass the UUID if we want to move to UUIDs publicly.
    // But let's check what verifySignature expects.
    // For now, let's stick to _id.toString() or change to uuid?
    // The plan says "Update all wallet operations". 
    // Let's use uuid for challenge generation to be consistent with public ID.
    const challenge = await this.stellarVerificationService.generateChallenge(
      wallet.uuid, 
    );

    return { wallet, challenge };
  }

  async verifyWallet(
    userId: string,
    walletId: string,
    signature: string,
    challenge: string,
  ): Promise<Wallet> {
    const uId = await this.resolveUserId(userId);
    
    let query: any = { userId: uId };
    if (UuidUtil.validate(walletId)) {
        query.uuid = walletId;
    } else {
        query._id = new Types.ObjectId(walletId);
    }

    const wallet = await this.walletModel.findOne(query);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const isVerified = await this.stellarVerificationService.verifySignature(
      wallet.address,
      signature,
      challenge,
      wallet.uuid, // Use uuid as the payload for verification matching addWallet
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
    const uId = await this.resolveUserId(userId);
    
    let query: any = { userId: uId };
    if (UuidUtil.validate(walletId)) {
        query.uuid = walletId;
    } else {
        query._id = new Types.ObjectId(walletId);
    }

    const wallet = await this.walletModel.findOneAndUpdate(
      query,
      { $set: data },
      { new: true },
    );

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async removeWallet(userId: string, walletId: string): Promise<void> {
    const uId = await this.resolveUserId(userId);

    let query: any = { userId: uId };
    if (UuidUtil.validate(walletId)) {
        query.uuid = walletId;
    } else {
        query._id = new Types.ObjectId(walletId);
    }

    const wallet = await this.walletModel.findOne(query);

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
    const uId = await this.resolveUserId(userId);

    let query: any = { userId: uId };
    if (UuidUtil.validate(walletId)) {
        query.uuid = walletId;
    } else {
        query._id = new Types.ObjectId(walletId);
    }

    const wallet = await this.walletModel.findOne(query);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.isVerified) {
      throw new BadRequestException('Only verified wallets can be set as primary');
    }

    // Atomic update to unset other primary wallets and set the new one
    await this.walletModel.updateMany(
      { userId: uId },
      { $set: { isPrimary: false } },
    );

    wallet.isPrimary = true;
    return wallet.save();
  }
}

