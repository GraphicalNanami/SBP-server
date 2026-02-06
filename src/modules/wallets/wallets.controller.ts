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
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyWallets(@Req() req: any) {
    return this.walletsService.findByUserId(req.user.uuid);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addWallet(@Req() req: any, @Body() data: AddWalletDto) {
    return this.walletsService.addWallet(req.user.uuid, data);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyWallet(
    @Req() req: any,
    @Param() params: UuidParamDto,
    @Body() data: VerifyWalletDto,
  ) {
    return this.walletsService.verifyWallet(
      req.user.uuid,
      params.id,
      data.signature,
      data.challenge,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateWallet(
    @Req() req: any,
    @Param() params: UuidParamDto,
    @Body() data: UpdateWalletDto,
  ) {
    return this.walletsService.updateWallet(req.user.uuid, params.id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeWallet(@Req() req: any, @Param() params: UuidParamDto) {
    await this.walletsService.removeWallet(req.user.uuid, params.id);
    return { message: 'Wallet removed successfully' };
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard)
  async setPrimary(@Req() req: any, @Param() params: UuidParamDto) {
    return this.walletsService.setPrimary(req.user.uuid, params.id);
  }
}
