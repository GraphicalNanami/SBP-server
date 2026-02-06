import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RefreshDto } from '@/modules/auth/dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshDto: RefreshDto) {
    await this.authService.logout(refreshDto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
