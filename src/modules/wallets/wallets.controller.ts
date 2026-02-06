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
import {
  AddWalletDto,
  VerifyWalletDto,
  UpdateWalletDto,
} from '@/src/modules/wallets/dto/wallet.dto';
import { UuidParamDto } from '@/src/common/dto/uuid-param.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user wallets' })
  @ApiResponse({ status: 200, description: 'Return list of wallets.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyWallets(@Req() req: any) {
    return this.walletsService.findByUserId(req.user.uuid);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a new wallet' })
  @ApiResponse({ status: 201, description: 'Wallet added successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async addWallet(@Req() req: any, @Body() data: AddWalletDto) {
    return this.walletsService.addWallet(req.user.uuid, data);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify wallet ownership' })
  @ApiParam({ name: 'id', description: 'Wallet UUID' })
  @ApiResponse({ status: 201, description: 'Wallet verified successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
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
  @ApiOperation({ summary: 'Update wallet details' })
  @ApiParam({ name: 'id', description: 'Wallet UUID' })
  @ApiResponse({ status: 200, description: 'Wallet updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async updateWallet(
    @Req() req: any,
    @Param() params: UuidParamDto,
    @Body() data: UpdateWalletDto,
  ) {
    return this.walletsService.updateWallet(req.user.uuid, params.id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a wallet' })
  @ApiParam({ name: 'id', description: 'Wallet UUID' })
  @ApiResponse({ status: 200, description: 'Wallet removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async removeWallet(@Req() req: any, @Param() params: UuidParamDto) {
    await this.walletsService.removeWallet(req.user.uuid, params.id);
    return { message: 'Wallet removed successfully' };
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set wallet as primary' })
  @ApiParam({ name: 'id', description: 'Wallet UUID' })
  @ApiResponse({ status: 201, description: 'Wallet set as primary.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Wallet not found.' })
  async setPrimary(@Req() req: any, @Param() params: UuidParamDto) {
    return this.walletsService.setPrimary(req.user.uuid, params.id);
  }
}
