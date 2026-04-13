import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { GameModule } from './game/game.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { vaultConfigFactory } from './vault/vault.config';
import { AchievementsModule } from './achievements/achievements.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { FortyTwoApiModule } from './forty_two/forty-two-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [vaultConfigFactory],
    }),
    ThrottlerModule.forRoot([
      {
        // Default limits are only enforced on routes that opt into ThrottlerGuard.
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    GameModule,
    MatchmakingModule,
    RealtimeModule,
    AchievementsModule,
    FortyTwoApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


