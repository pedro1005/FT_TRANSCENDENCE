import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthenticatedSocket } from '../auth/ws-auth.middleware';
import { UsersService } from '../users/users.service';

export abstract class AuthenticatedGatewayBase implements OnGatewayConnection, OnGatewayDisconnect {
	protected readonly logger = new Logger(AuthenticatedGatewayBase.name);

	protected connectedUsers: Map<string, string> = new Map(); // socketId -> userId

	protected UserSockets: Map<string, string> = new Map(); // userId -> socketId

	constructor(protected userService: UsersService) {}

	handleConnection(client: Socket) {
		const authClient = client as AuthenticatedSocket;

		if (authClient.user) {
			// Track authenticated connection
			this.connectedUsers.set(authClient.id, authClient.user.id);
			this.UserSockets.set(authClient.user.id, authClient.id);

			this.logger.log(`User ${authClient.user.username} (${authClient.user.id}) connected on socket ${authClient.id}`);
		} else {
			this.logger.warn(`Unauthenticated socket connected: ${client.id}`);
		}
	}
	
	handleDisconnect(client: Socket) {
		const userId = this.connectedUsers.get(client.id);
		const authClient = client as AuthenticatedSocket;
		const username = authClient.user?.username;

		if (userId) {
			this.connectedUsers.delete(client.id);
			this.UserSockets.delete(userId);

			if (username) {
				this.logger.log(`User ${username} (${userId}) disconnected from socket ${client.id}`);
			} else {
				this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
			}
		} else {
			this.logger.log(`Socket disconnected: ${client.id}`);
		}
	}

	protected getUserFromSocket(socketId: string): string | undefined {
		return this.connectedUsers.get(socketId);
	}

	protected getSocketFromUser(userId: string): string | undefined {
		return this.UserSockets.get(userId);
	}

	protected isAuthenticated(client: Socket): client is AuthenticatedSocket {
		return 'user' in client && client.user !== undefined;
	}

	protected getUser(client: Socket): AuthenticatedSocket['user'] {
		if (!this.isAuthenticated(client)) {
			throw new Error('Client is not authenticated');
		}
		return client.user;
	}
}