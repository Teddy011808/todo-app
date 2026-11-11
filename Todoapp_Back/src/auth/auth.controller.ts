import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  CurrentUser,
  type AuthUser,
} from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { CredentialsDto } from './dto/credentials.dto.js';

// 5 tries a minute per IP, so passwords cannot be guessed quickly
const STRICT = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 201 { id, email }, or 409 when the email exists
  @Public()
  @Throttle(STRICT)
  @Post('signup')
  signup(@Body() dto: CredentialsDto) {
    return this.auth.signup(dto);
  }

  // 200 { accessToken } + refresh cookie, or 401 Invalid credentials
  @Public()
  @Throttle(STRICT)
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: CredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = await this.auth.login(dto);
    return this.auth.issueTokens(userId, res);
  }

  // Public: the access token has expired (or the page reloaded); the cookie is the proof
  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = await this.auth.useRefresh(
      this.auth.readRefreshCookie(req.cookies),
    );
    return this.auth.issueTokens(userId, res);
  }

  // Public: the cookie is the proof, so logout works even after the access token expired
  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.auth.readRefreshCookie(req.cookies));
    this.auth.clearRefreshCookie(res);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
