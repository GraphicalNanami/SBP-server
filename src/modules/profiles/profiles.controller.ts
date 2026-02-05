import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfilesService } from './profiles.service';
import { UsersService } from '../users/users.service';

@Controller('profile')
export class ProfilesController {
  constructor(
    private profilesService: ProfilesService,
    private usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profilesService.findByUserId(userId);

    return {
      user,
      profile,
    };
  }
}
