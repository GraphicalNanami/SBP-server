import { Injectable, UnauthorizedException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { hash, compare } from 'bcrypt';
import { Types } from 'mongoose';
import { Keypair } from '@stellar/stellar-sdk';
import { UsersService } from '@/src/modules/users/users.service';
import { ProfilesService } from '@/src/modules/profiles/profiles.service';
import { WalletsService } from '@/src/modules/wallets/wallets.service';
import { RedisService } from '@/src/database/redis/redis.service';
import { User } from '@/src/modules/users/schemas/user.schema';
import { RegisterDto } from '@/src/modules/auth/dto/register.dto';
import { LoginDto } from '@/src/modules/auth/dto/login.dto';
import { LogInteraction } from '@/src/common/decorators/log-interaction.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private profilesService: ProfilesService,
    private walletsService: WalletsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @LogInteraction()
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Hash password
    const bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    const hashedPassword = await hash(password, bcryptRounds);

    // Create user (UsersService handles duplicate check)
    const user = await this.usersService.create(email, hashedPassword, name);

    // Create profile for new user
    await this.profilesService.create({
      userId: user._id,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @LogInteraction()
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password - type assertion needed because password has select: false
    const userWithPassword = user as User & { password: string };
    const isPasswordValid = await compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.uuid,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.uuid);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const ttl = this.configService.get<number>('JWT_REFRESH_TTL');

    await this.redisService.set(`refresh:${tokenHash}`, userId, ttl);

    return token;
  }

  @LogInteraction()
  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const userId = await this.redisService.get(`refresh:${tokenHash}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Rotate refresh token
    await this.redisService.del(`refresh:${tokenHash}`);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @LogInteraction()
  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redisService.del(`refresh:${tokenHash}`);
  }

  // ============ Wallet Authentication Methods ============

  @LogInteraction()
  async checkWalletExistence(walletAddress: string): Promise<{
    exists: boolean;
    userExists: boolean;
    message: string;
  }> {
    // Find wallet by address
    const wallet = await this.walletsService.findByAddress(walletAddress);
    
    if (!wallet) {
      return {
        exists: false,
        userExists: false,
        message: 'Wallet not registered. Please sign up first.',
      };
    }
    
    // Verify user still exists
    const user = await this.usersService.findById(wallet.userId.toString());
    
    return {
      exists: true,
      userExists: !!user,
      message: 'Wallet is registered. Proceed with login.',
    };
  }

  @LogInteraction()
  async generateWalletChallenge(walletAddress: string): Promise<{ challenge: string; expiresAt: Date }> {
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const challenge = `Sign this message to authenticate with Stellar Build Portal: ${nonce}:${timestamp}`;
    
    // Store in Redis with SHA-256 hash of wallet address + nonce as key
    const addressHash = createHash('sha256').update(walletAddress).digest('hex');
    const key = `wallet-challenge:${addressHash}:${nonce}`;
    const ttl = 300; // 5 minutes
    
    await this.redisService.set(key, walletAddress, ttl);
    
    const expiresAt = new Date(timestamp + ttl * 1000);
    
    return { challenge, expiresAt };
  }

  private async verifyWalletSignature(
    walletAddress: string,
    challenge: string,
    signature: string,
  ): Promise<boolean> {
    try {
      this.logger.debug(`=== Starting Wallet Signature Verification ===`);
      this.logger.debug(`Wallet Address: ${walletAddress}`);
      this.logger.debug(`Challenge: ${challenge}`);
      this.logger.debug(`Signature Type: ${typeof signature}`);
      this.logger.debug(`Signature Length: ${signature?.length}`);
      
      // Extract nonce from challenge
      const nonceMatch = challenge.match(/: ([a-f0-9]+):/);
      if (!nonceMatch) {
        this.logger.error('❌ Invalid challenge format - nonce not found');
        this.logger.error(`Challenge pattern expected: "Sign this message to authenticate with Stellar Build Portal: <nonce>:<timestamp>"`);
        return false;
      }
      const nonce = nonceMatch[1];
      this.logger.debug(`✓ Extracted nonce: ${nonce}`);
      
      // Check if challenge exists in Redis
      const addressHash = createHash('sha256').update(walletAddress).digest('hex');
      const key = `wallet-challenge:${addressHash}:${nonce}`;
      this.logger.debug(`Redis key: ${key}`);
      
      const storedAddress = await this.redisService.get(key);
      this.logger.debug(`Stored address in Redis: ${storedAddress || 'NOT FOUND'}`);
      
      if (!storedAddress) {
        this.logger.error('❌ Challenge not found in Redis (expired or never generated)');
        return false;
      }
      
      if (storedAddress !== walletAddress) {
        this.logger.error(`❌ Address mismatch: stored=${storedAddress}, provided=${walletAddress}`);
        return false;
      }
      
      this.logger.debug('✓ Challenge found and address matches');
      
      // Verify signature using Stellar SDK directly
      try {
        this.logger.debug('Starting cryptographic verification...');
        const keypair = Keypair.fromPublicKey(walletAddress);
        this.logger.debug('✓ Keypair created from public key');
        
        // Try both methods: with hash and without hash
        const signatureBuffer = Buffer.from(signature, 'base64');
        
        // Method 1: Hash the message (what Freighter should be doing)
        const messageHash = createHash('sha256').update(challenge).digest();
        this.logger.debug(`Message hash (hex): ${messageHash.toString('hex')}`);
        this.logger.debug(`Signature (hex): ${signatureBuffer.toString('hex')}`);
        
        let isValid = keypair.verify(messageHash, signatureBuffer);
        
        // Method 2: Try without hashing (just in case)
        if (!isValid) {
          this.logger.debug('Trying verification without hashing...');
          const challengeBuffer = Buffer.from(challenge, 'utf8');
          isValid = keypair.verify(challengeBuffer, signatureBuffer);
        }
        
        // Method 3: Try with Base64 decoded challenge (edge case)
        if (!isValid) {
          this.logger.debug('Trying with different encodings...');
          // Sometimes the message might be base64 encoded
          try {
            const challengeBase64 = Buffer.from(challenge, 'base64');
            isValid = keypair.verify(challengeBase64, signatureBuffer);
          } catch (e) {
            // Not base64, ignore
          }
        }
        
        this.logger.debug(`Message hash length: ${messageHash.length}`);
        this.logger.debug(`Signature buffer length: ${signatureBuffer.length}`);
        
        if (isValid) {
          this.logger.log('✅ Signature verification SUCCESSFUL');
          // Delete challenge after successful verification (one-time use)
          await this.redisService.del(key);
          this.logger.debug('✓ Challenge deleted from Redis');
        } else {
          this.logger.error('❌ Signature verification FAILED - signature does not match with any method');
          this.logger.error(`Challenge (raw): ${challenge}`);
          this.logger.error(`Challenge (hex): ${Buffer.from(challenge).toString('hex')}`);
        }
        
        return isValid;
      } catch (cryptoError) {
        this.logger.error(`❌ Cryptographic signature verification error: ${cryptoError.message}`);
        this.logger.error(`Stack: ${cryptoError.stack}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Wallet signature verification failed: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      return false;
    }
  }

  @LogInteraction()
  async registerWithWallet(
    walletAddress: string,
    signature: string,
    challenge: string,
    name?: string,
  ) {
    // Verify signature
    const isValid = await this.verifyWalletSignature(walletAddress, challenge, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature or challenge');
    }
    
    // Check if wallet already exists
    const existingWallet = await this.walletsService.findByAddress(walletAddress);
    if (existingWallet) {
      throw new ConflictException('Wallet address already registered');
    }
    
    // Create user with wallet-only authentication
    const userName = name || `Stellar User ${walletAddress.substring(0, 8)}`;
    const user = await this.usersService.createWalletUser(userName);
    
    // Create profile for new user
    await this.profilesService.create({
      userId: user._id,
    });
    
    // Create verified wallet
    await this.walletsService.createVerifiedWallet(user._id, walletAddress);
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @LogInteraction()
  async loginWithWallet(
    walletAddress: string,
    signature: string,
    challenge: string,
  ) {
    // Verify signature
    const isValid = await this.verifyWalletSignature(walletAddress, challenge, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature or challenge');
    }
    
    // Find wallet
    const wallet = await this.walletsService.findByAddress(walletAddress);
    if (!wallet) {
      throw new UnauthorizedException('Wallet not found. Please register first.');
    }
    
    // Find user
    const user = await this.usersService.findById(wallet.userId.toString());
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Update wallet's lastUsedAt
    wallet.lastUsedAt = new Date();
    await wallet.save();
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return {
      ...tokens,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
