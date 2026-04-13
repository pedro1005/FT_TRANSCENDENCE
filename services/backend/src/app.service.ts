import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()

// Original getHello() updated to test Prisma integration
/*export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}*/

export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    const users = await this.prisma.user.findMany();
    return `Hello World! Users in DB: ${users.length}`;
  }
}
