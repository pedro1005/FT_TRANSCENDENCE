import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // Updated to async to match PrismaService async queries
  //getHello(): string {  
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }
}
