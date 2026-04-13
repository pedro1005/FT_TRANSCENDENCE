import {
	Controller,
	Post,
	Body,
	UnauthorizedException,
	HttpCode,
	HttpStatus,
	Get,
	UseGuards,
	Req,
	Res
} from '@nestjs/common';
import { AuthService, AuthResponse, UserWithoutPassword } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AUTH_COOKIE_NAME } from '../common/security';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../common/throttler.guard';

function createAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED) // REST best practice: 201 Created for successful POST that creates a resource
  async register(@Body() RegisterDto: RegisterDto): Promise<UserWithoutPassword> {
    return this.authService.register(RegisterDto);
  }

  @Post('login')
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK) // 200 OK for successful login
  async login(@Body() LoginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
	const user = await this.authService.validateUser(
			LoginDto.email,
			LoginDto.password
	);

	if (!user) {
		throw new UnauthorizedException('Invalid credentials');
	}

  const authResponse = await this.authService.login(user);
  res.cookie(AUTH_COOKIE_NAME, authResponse.access_token, createAuthCookieOptions());

  return authResponse;
  }
    // 🔐 Redirect to 42 login
  @Get('42')
  @UseGuards(AuthGuard('42'))
  login42() {
    // Passport handles the redirect automatically
  }

  // 🔁 Callback from 42 OAuth
  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async callback42(@Req() req, @Res() res: Response) {
   try {
    const user = await this.authService.validateOAuthLogin(req.user);
    const token = await this.authService.login(user);
  res.cookie(AUTH_COOKIE_NAME, token.access_token, createAuthCookieOptions());

  return res.redirect('/');
  } catch (e) {
    return res.redirect('/login?error=' + encodeURIComponent(e.message));
  }
}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logged out' };
  }
}
