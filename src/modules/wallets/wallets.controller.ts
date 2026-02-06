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
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { WalletsService } from '@/src/modules/wallets/wallets.service';
import { AddWalletDto, VerifyWalletDto, UpdateWalletDto } from '@/src/modules/wallets/dto/wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyWallets(@Req() req: any) {
    return this.walletsService.findByUserId(req.user._id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addWallet(@Req() req: any, @Body() data: AddWalletDto) {
    return this.walletsService.addWallet(req.user._id, data);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyWallet(
    @Req() req: any,
    @Param('id') walletId: string,
    @Body() data: VerifyWalletDto,
  ) {
    return this.walletsService.verifyWallet(
      req.user._id,
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
    return this.walletsService.updateWallet(req.user._id, walletId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeWallet(@Req() req: any, @Param('id') walletId: string) {
    await this.walletsService.removeWallet(req.user._id, walletId);
    return { message: 'Wallet removed successfully' };
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard)
  async setPrimary(@Req() req: any, @Param('id') walletId: string) {
    return this.walletsService.setPrimary(req.user._id, walletId);
  }
}
