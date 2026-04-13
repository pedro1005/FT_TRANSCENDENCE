import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UnlockedAchievementSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private prisma: PrismaService) {}

  async checkAndUnlock(userId: string): Promise<UnlockedAchievementSummary[]> {
    const [matches, currentAchievements] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          status: { in: ['COMPLETED', 'ABANDONED'] },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ]);

    const allAchievements = await this.prisma.achievement.findMany();
    const unlockedKeys = new Set(
      currentAchievements.map((ua) => {
        const a = allAchievements.find((a) => a.id === ua.achievementId);
        return a?.key;
      })
    );

    const wins = matches.filter((m) => m.winnerId === userId);
    const totalPlayed = matches.length;
    const aiWins = wins.filter((m) => m.gameMode === 'AI');
    const perfectGames = wins.filter((m) => {
      const isPlayer1 = m.player1Id === userId;
      return isPlayer1 ? m.score2 === 0 : m.score1 === 0;
    });

    // Win streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    for (const m of [...matches].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
      if (m.winnerId === userId) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const toUnlock: string[] = [];

    const check = (key: string, condition: boolean) => {
      if (condition && !unlockedKeys.has(key)) toUnlock.push(key);
    };

    check('FIRST_WIN',     wins.length >= 1);
    check('WIN_5',         wins.length >= 5);
    check('WIN_10',        wins.length >= 10);
    check('WIN_25',        wins.length >= 25);
    check('PLAY_10',       totalPlayed >= 10);
    check('PLAY_50',       totalPlayed >= 50);
    check('BEAT_AI',       aiWins.length >= 1);
    check('PERFECT_GAME',  perfectGames.length >= 1);
    check('WIN_STREAK_3',  maxStreak >= 3);
    check('WIN_STREAK_5',  maxStreak >= 5);

    if (toUnlock.length === 0) return [];

    const achievementRecords = allAchievements.filter((a) => toUnlock.includes(a.key));

    await this.prisma.userAchievement.createMany({
      data: achievementRecords.map((a) => ({
        userId,
        achievementId: a.id,
      })),
      skipDuplicates: true,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    const userLabel = user?.username ? `${user.username} (${userId})` : userId;
    this.logger.log(`Unlocked for ${userLabel}: ${toUnlock.join(', ')}`);

    return achievementRecords.map((achievement) => ({
      id: achievement.id,
      key: achievement.key,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
    }));
  }

  async getUserAchievements(userId: string) {
    const [userAchievements, allAchievements] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.prisma.achievement.findMany(),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    return {
      unlocked: userAchievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      locked: allAchievements.filter((a) => !unlockedIds.has(a.id)),
      total: allAchievements.length,
      unlockedCount: userAchievements.length,
    };
  }

  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: {
        username: { not: 'AI' },
      },
      select: {
        id: true,
        username: true,
        matchesAsPlayer1: { where: { status: { in: ['COMPLETED', 'ABANDONED'] } }, select: { winnerId: true, score1: true, score2: true } },
        matchesAsPlayer2: { where: { status: { in: ['COMPLETED', 'ABANDONED'] } }, select: { winnerId: true, score1: true, score2: true } },
        _count: { select: { achievements: true } },  // <-- fix below
      },
    });

    const leaderboard = users.map((u) => {
      const matches = [...u.matchesAsPlayer1, ...u.matchesAsPlayer2];
      const wins = u.matchesAsPlayer1.filter((m) => m.winnerId === u.id).length
                 + u.matchesAsPlayer2.filter((m) => m.winnerId === u.id).length;
      const total = matches.length;
      const losses = total - wins;
      const winRate = total > 0 ? (wins / total) * 100 : 0;

      return {
        id: u.id,
        username: u.username,
        wins,
        losses,
        total,
        winRate: Math.round(winRate * 10) / 10,
      };
    });

    return leaderboard
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }
}
