import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	MaxLength,
	Matches
} from 'class-validator';

export class RegisterDto {
	@IsNotEmpty({ message: 'Username is required' })
	@IsString({ message: 'Username must be a string' })
	@MinLength(3, { message: 'Username must be at least 3 characters' })
	@MaxLength(20, { message: 'Username must not exceed 20 characters' })
	@Matches(/^[a-zA-Z0-9_-]+$/, {
		message: 'Username can only contain letters, numbers, underscores, and hyphens',
	})
	username: string;

	@IsNotEmpty({ message: 'Email is required' })
	@IsEmail({}, { message: 'Email must be a valid email address' })
	email: string;

	@IsNotEmpty({ message: 'Password is required' })
	@IsString({ message: 'Password must be a string' })
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	@MaxLength(50, { message: 'Password must not exceed 128 characters' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
		message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
	})
	password: string;
}