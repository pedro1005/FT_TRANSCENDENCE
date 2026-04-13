import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { UsersModule } from '../users/users.module';
import { FtStrategy } from './ft.strategy';

@Global()
@Module({
	imports: [
		UsersModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return {
					secret: configService.get<string>('JWT_SECRET'),
					signOptions: { expiresIn: '24h' },
				};
			},
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, PrismaService, JwtStrategy, JwtAuthGuard, FtStrategy],
	exports: [AuthService, JwtAuthGuard, JwtStrategy, JwtModule], // Export so that other modules can use them
})
export class AuthModule {}


