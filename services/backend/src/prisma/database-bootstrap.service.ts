import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
	AI_USER_EMAIL,
	AI_USER_ID,
	AI_USER_PASSWORD_HASH,
	AI_USER_USERNAME,
} from '../game/ai/ai-user.constants';

@Injectable()
export class DatabaseBootstrapService implements OnModuleInit {
	private readonly logger = new Logger(DatabaseBootstrapService.name);

	constructor(private readonly prisma: PrismaService) {}

	async onModuleInit(): Promise<void> {
		await this.ensureAIUser();
	}

	private async ensureAIUser(): Promise<void> {
		const existingAIUser = await this.prisma.user.findUnique({
			where: { id: AI_USER_ID },
			select: { id: true },
		});

		if (existingAIUser) {
			this.logger.log('AI user seed already applied; skipping.');
			return;
		}

		await this.prisma.user.create({
			data: {
				id: AI_USER_ID,
				email: AI_USER_EMAIL,
				username: AI_USER_USERNAME,
				password: AI_USER_PASSWORD_HASH,
				role: Role.USER,
			},
		});

		this.logger.log('AI user seed created successfully.');
	}
}
