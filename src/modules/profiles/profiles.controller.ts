import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { ProfilesService } from '@/src/modules/profiles/profiles.service';
import { UpdatePersonalInfoDto } from '@/src/modules/profiles/dto/update-personal-info.dto';

@Controller('profile')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.profilesService.getCompleteProfile(req.user._id);
  }

  @Patch('personal-info')
  @UseGuards(JwtAuthGuard)
  async updatePersonalInfo(
    @Req() req: any,
    @Body() updateDto: UpdatePersonalInfoDto,
  ) {
    const profile = await this.profilesService.update(
      req.user._id,
      updateDto,
    );
    return {
      message: 'Profile updated successfully',
      profile,
    };
  }

  @Post('upload-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const profilePictureUrl = await this.profilesService.uploadProfilePicture(
      req.user._id,
      file,
    );
    return {
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
    };
  }
}
