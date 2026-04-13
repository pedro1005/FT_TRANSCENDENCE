import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
	controllers: [UsersController],
	providers: [UsersService, PrismaService],
	exports: [UsersService], // Export UsersService so it can be used in AuthModule for user validation
})
export class UsersModule {}
