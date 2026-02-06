import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, Networks } from '@stellar/stellar-sdk';
import { RedisService } from '@/src/database/redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class StellarVerificationService {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async generateChallenge(walletId: string): Promise<string> {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const challenge = `Verify ownership of wallet on SBP|nonce:${nonce}|timestamp:${timestamp}`;
    // Store challenge in Redis with 5-minute TTL
    await this.redisService.set(`challenge:${walletId}`, challenge, 300);
    return challenge;
  }

  async verifySignature(
    address: string,
    signature: string,
    challenge: string,
    walletId: string,
  ): Promise<boolean> {
    const storedChallenge = await this.redisService.get(
      `challenge:${walletId}`,
    );
    if (!storedChallenge || storedChallenge !== challenge) {
      throw new BadRequestException('Challenge expired or invalid');
    }

    try {
      const keypair = Keypair.fromPublicKey(address);
      const isVerified = keypair.verify(
        Buffer.from(challenge),
        Buffer.from(signature, 'base64'),
      );
      if (isVerified) {
        // Delete challenge after successful verification
        await this.redisService.del(`challenge:${walletId}`);
      }
      return isVerified;
    } catch (error) {
      console.error('Signature verification failed', error);
      return false;
    }
  }
}
