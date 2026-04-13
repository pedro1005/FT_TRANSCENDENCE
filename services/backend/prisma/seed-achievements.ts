import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Create a native PG connection pool using your verified env variable
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the client constructor
const prisma = new PrismaClient({ adapter });

const ACHIEVEMENTS = [
  { key: 'FIRST_WIN',     name: 'First Blood',      description: 'Win your first match',           icon: '🏆' },
  { key: 'WIN_5',          name: 'On a Roll',         description: 'Win 5 matches',                  icon: '🔥' },
  { key: 'WIN_10',        name: 'Veteran',           description: 'Win 10 matches',                 icon: '⚡' },
  { key: 'WIN_25',        name: 'Champion',          description: 'Win 25 matches',                 icon: '👑' },
  { key: 'PLAY_10',       name: 'Committed',         description: 'Play 10 matches',                icon: '🎮' },
  { key: 'PLAY_50',       name: 'Dedicated',         description: 'Play 50 matches',                icon: '💪' },
  { key: 'BEAT_AI',       name: 'Machine Slayer',    description: 'Beat the AI',                    icon: '🤖' },
  { key: 'PERFECT_GAME',  name: 'Flawless',          description: 'Win without conceding a point',  icon: '✨' },
  { key: 'WIN_STREAK_3',  name: 'Hat Trick',         description: 'Win 3 matches in a row',         icon: '🎯' },
  { key: 'WIN_STREAK_5',  name: 'Unstoppable',       description: 'Win 5 matches in a row',         icon: '🌪' },
];

async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {},
      create: a,
    });
  }
  console.log('✅ Achievements seeded');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Clean up the connection pool as well
  });

