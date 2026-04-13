import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { isAllowedOrigin } from './common/security';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const logger = new Logger('Bootstrap');

	// Respect X-Forwarded-For when running behind nginx so rate limiting uses real client IPs.
	app.getHttpAdapter().getInstance().set('trust proxy', 1);

	// Enable CORS
	app.enableCors({
		origin: (origin, callback) => {
			if (isAllowedOrigin(origin)) {
				return callback(null, true);
			}

			logger.warn(`CORS rejected origin: ${origin}`);
			callback(new Error('Not allowed by CORS'));
		},
		credentials: true, // Allow cookies and other credentials
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Strip properties that do not have decorators
			forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
			transform: true, // Automatically transform payloads to DTO instances
		}),
	);

	const port = Number(process.env.PORT) || 3000;
	await app.listen(port, '0.0.0.0');
	
	logger.log(`Server is running on http://0.0.0.0:${port}`);
}
bootstrap();