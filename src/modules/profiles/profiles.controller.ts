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
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/src/modules/auth/guards/jwt-auth.guard';
import { ProfilesService } from '@/src/modules/profiles/profiles.service';
import { UpdatePersonalInfoDto } from '@/src/modules/profiles/dto/update-personal-info.dto';
import { PublicProfileDto } from '@/src/modules/profiles/dto/public-profile.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profile')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@Req() req: any) {
    return this.profilesService.getCompleteProfile(req.user.uuid);
  }

  @Patch('personal-info')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update personal info' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updatePersonalInfo(
    @Req() req: any,
    @Body() updateDto: UpdatePersonalInfoDto,
  ) {
    const profile = await this.profilesService.update(req.user.uuid, updateDto);
    return {
      message: 'Profile updated successfully',
      profile,
    };
  }

  @Post('upload-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Profile picture uploaded successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async uploadPicture(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const profilePictureUrl = await this.profilesService.uploadProfilePicture(
      req.user.uuid,
      file,
    );
    return {
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
    };
  }

  @Get('public/:identifier')
  @ApiOperation({ 
    summary: 'Get public profile by username or UUID',
    description: 'Retrieve public profile information for any user. No authentication required.'
  })
  @ApiParam({
    name: 'identifier',
    description: 'User identifier (username or UUID)',
    example: 'john_stellar',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return public profile.',
    type: PublicProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getPublicProfile(@Param('identifier') identifier: string): Promise<PublicProfileDto> {
    const profile = await this.profilesService.findPublicProfileByIdentifier(identifier);
    
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    
    return profile;
  }
}
