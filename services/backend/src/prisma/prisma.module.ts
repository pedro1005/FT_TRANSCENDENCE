// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseBootstrapService } from './database-bootstrap.service';

@Global() // Makes PrismaService available everywhere without re-importing
@Module({
  providers: [PrismaService, DatabaseBootstrapService],
  exports: [PrismaService],
})
export class PrismaModule {}
