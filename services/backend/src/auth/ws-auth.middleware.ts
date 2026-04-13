import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { extractAuthTokenFromCookieHeader } from '../common/security';

export interface AuthenticatedSocket extends Socket {
	user: {
		id: string;
		email: string;
		role: string;
		username: string;
	};
}

export class WsAuthMiddleware {
	private readonly logger = new Logger(WsAuthMiddleware.name);

	constructor(private jwtService: JwtService) {}

	// Validate JWT from WebSocket handshake
	// 1. Auth header: Authorization: Bearer <token>
	// 2. Cookie: access_token=<token>
	// 3. Handshake auth: socket.auth.token
	async use(socket: Socket, next: (err?: Error) => void) {
		try {
			const token = this.extractToken(socket);

			if (!token) {
				throw new WsException('Authentication token not provided');
			}

			const payload = this.jwtService.verify(token);


			(socket as AuthenticatedSocket).user = {
				id: payload.sub,
				email: payload.email,
				role : payload.role,
				username: payload.username,
			};

			next();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			if (message === 'Authentication token not provided') {
				this.logger.warn(
					`WebSocket authentication rejected (missing token) for socket ${socket.id}`,
				);
			} else {
				this.logger.error(`WebSocket authentication failed: ${message}`);
			}

			next(new Error('Authentication failed'));
		}
	}

	private extractToken(socket: Socket): string | null {
		const authHeader = socket.handshake.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		const cookieToken = extractAuthTokenFromCookieHeader(socket.handshake.headers.cookie);
		if (cookieToken) {
			return cookieToken;
		}

		const authToken = socket.handshake.auth?.token;
		if (authToken && typeof authToken === 'string') {
			return authToken;
		}

		return null;
	}
}