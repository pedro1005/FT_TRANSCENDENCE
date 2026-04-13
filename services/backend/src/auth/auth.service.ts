import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

export interface AuthResponse {
  access_token: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserWithoutPassword> {
    return this.usersService.create(registerDto);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user || !user.password) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: UserWithoutPassword): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateOAuthLogin(profile: { email: string; username: string; intraId: number }): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
	OR: [{ email: profile.email }, { username: profile.username }],
      },
    });

    if (existingUser && existingUser.password) {
      throw new ConflictException(
        'This email or username is already registered manually. Please login with your password.'
      );
    }

    let user = existingUser;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username,
          password: null,
        },
      });
    }

    const { password: _, ...result } = user;
    return result;
  }
}
