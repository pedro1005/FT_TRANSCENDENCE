import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { extractAuthTokenFromCookieHeader } from '../common/security';

export interface JwtPayload {
	sub: string; // JWT standard: "subject" = user id
	email: string;
	role: string;
	username: string;
}

// Define what validate() returns (what gets attached to request.user)
export interface AuthenticatedUser {
	id: string;
	email: string;
	role: string;
	username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // JWT_SECRET is validated centrally during ConfigModule startup.
    const secret = configService.get<string>('JWT_SECRET');

    super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: Request) => {
					if (!request) {
						return null;
					}

					const authHeader = request.headers.authorization;
					if (authHeader?.startsWith('Bearer ')) {
						return authHeader.slice(7);
					}

					return extractAuthTokenFromCookieHeader(request.headers.cookie);
				},
			]),
      secretOrKey: secret as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
	id: payload.sub,
	email: payload.email,
	role: payload.role,
	username: payload.username,
    };
  }
}
