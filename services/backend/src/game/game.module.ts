import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchController } from './match.controller';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
	controllers: [MatchController],
	providers: [GameService, MatchService, PrismaService],
	exports: [GameService, MatchService],
	imports: [AchievementsModule],
})
export class GameModule {}
