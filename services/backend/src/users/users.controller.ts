import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	UseGuards,
	Request,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('api/users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Request() req, @Body() body: CreateUserDto) {
		if (req.user.role !== 'ADMIN') {
			throw new ForbiddenException('Forbidden');
		}

		return this.usersService.create(body);
	}

	// PROTECTED
	@Get()
	@UseGuards(JwtAuthGuard)
	findAll() {
		return this.usersService.findAll();
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getProfile(@Request() req) {
		// req.user comes from JwtStrategy.validate() which attaches the user to the request after validating the token
		return this.usersService.findById(req.user.id);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	async findOne(@Param('id') id: string) {
		const user = await this.usersService.findById(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return user;
	}
}
