import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '@/src/modules/auth/auth.service';
import { RegisterDto } from '@/src/modules/auth/dto/register.dto';
import { LoginDto } from '@/src/modules/auth/dto/login.dto';
import { RefreshDto } from '@/src/modules/auth/dto/refresh.dto';
import { WalletChallengeDto } from '@/src/modules/auth/dto/wallet-challenge.dto';
import { WalletRegisterDto } from '@/src/modules/auth/dto/wallet-register.dto';
import { WalletLoginDto } from '@/src/modules/auth/dto/wallet-login.dto';
import { WalletCheckExistenceDto } from '@/src/modules/auth/dto/wallet-check-existence.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout(@Body() refreshDto: RefreshDto) {
    await this.authService.logout(refreshDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  // ============ Wallet Authentication Endpoints ============

  @Post('wallet/check-existence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check if wallet address is registered',
    description: 'Lightweight check to determine if a wallet address is already registered in the system. This should be called BEFORE requesting a challenge to improve UX by not asking users to sign if they need to register first.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Check completed successfully.',
    schema: {
      type: 'object',
      properties: {
        exists: { 
          type: 'boolean', 
          description: 'Whether the wallet address is registered',
          example: true,
        },
        userExists: { 
          type: 'boolean', 
          description: 'Whether the associated user account exists',
          example: true,
        },
        message: { 
          type: 'string',
          example: 'Wallet is registered. Proceed with login.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address format.' })
  async checkWalletExistence(@Body() checkDto: WalletCheckExistenceDto) {
    return this.authService.checkWalletExistence(checkDto.walletAddress);
  }

  @Post('wallet/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate authentication challenge for wallet',
    description: 'Returns a challenge string that must be signed with the wallet private key. This endpoint must be called before wallet registration or login.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Challenge successfully generated.',
    schema: {
      type: 'object',
      properties: {
        challenge: { 
          type: 'string', 
          example: 'Sign this message to authenticate with Stellar Build Portal: abc123def456:1707580800000',
        },
        expiresAt: { 
          type: 'string', 
          format: 'date-time',
          example: '2026-02-10T12:35:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address format.' })
  async generateWalletChallenge(@Body() challengeDto: WalletChallengeDto) {
    return this.authService.generateWalletChallenge(challengeDto.walletAddress);
  }

  @Post('wallet/register')
  @ApiOperation({ 
    summary: 'Register new user with Freighter wallet',
    description: 'Creates a new user account using Stellar wallet authentication. Frontend must call /auth/wallet/challenge first to get a challenge, sign it with Freighter, then submit the signature here.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered with wallet.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            email: { type: 'string', nullable: true },
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid signature or challenge.' })
  @ApiResponse({ status: 401, description: 'Signature verification failed.' })
  @ApiResponse({ status: 409, description: 'Wallet address already registered.' })
  async registerWithWallet(@Body() registerDto: WalletRegisterDto) {
    return this.authService.registerWithWallet(
      registerDto.walletAddress,
      registerDto.signature,
      registerDto.challenge,
      registerDto.name,
    );
  }

  @Post('wallet/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user with Freighter wallet',
    description: 'Authenticates an existing user via Stellar wallet signature. Frontend must call /auth/wallet/challenge first to get a challenge, sign it with Freighter, then submit the signature here.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in with wallet.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            email: { type: 'string', nullable: true },
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid signature or challenge.' })
  @ApiResponse({ status: 401, description: 'Wallet not found or signature verification failed.' })
  async loginWithWallet(@Body() loginDto: WalletLoginDto) {
    return this.authService.loginWithWallet(
      loginDto.walletAddress,
      loginDto.signature,
      loginDto.challenge,
    );
  }
}
