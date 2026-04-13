import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}
	
	async create(data: CreateUserDto) {
		if (data.email.includes('@student.42')){
			throw new ConflictException(
				'Please use 42 OAuth to login with your 42 account.'
			);
		}
		const existingUser = await this.prisma.user.findFirst({
			where: {
				OR: [{ email: data.email }, { username: data.username }],
			},
		});

		if (existingUser) {
			throw new ConflictException('User already exists');
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);

		return this.prisma.user.create({
			data: {
				username: data.username,
				email: data.email,
				password: hashedPassword,
			},
			select: {
				id: true,
				email: true,
				username: true,
				role: true,
				createdAt: true,
			},
		});
	}

	async findAll() {
		return this.prisma.user.findMany({
			select: {
				id: true,
				email: true,
				username: true,
				role: true,
				createdAt: true,
			},
		});
	}

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				username: true,
				role: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	async findByEmailWithPassword(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
		});
	}
}
