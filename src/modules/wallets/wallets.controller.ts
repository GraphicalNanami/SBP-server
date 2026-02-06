import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { WalletsService } from '@/modules/wallets/wallets.service';
import { AddWalletDto, VerifyWalletDto, UpdateWalletDto } from '@/modules/wallets/dto/wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyWallets(@Req() req: any) {
    return this.walletsService.findByUserId(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addWallet(@Req() req: any, @Body() data: AddWalletDto) {
    return this.walletsService.addWallet(req.user.userId, data);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyWallet(
    @Req() req: any,
    @Param('id') walletId: string,
    @Body() data: VerifyWalletDto,
  ) {
    return this.walletsService.verifyWallet(
      req.user.userId,
      walletId,
      data.signature,
      data.challenge,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateWallet(
    @Req() req: any,
    @Param('id') walletId: string,
    @Body() data: UpdateWalletDto,
  ) {
    return this.walletsService.updateWallet(req.user.userId, walletId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeWallet(@Req() req: any, @Param('id') walletId: string) {
    await this.walletsService.removeWallet(req.user.userId, walletId);
    return { message: 'Wallet removed successfully' };
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard)
  async setPrimary(@Req() req: any, @Param('id') walletId: string) {
    return this.walletsService.setPrimary(req.user.userId, walletId);
  }
}
