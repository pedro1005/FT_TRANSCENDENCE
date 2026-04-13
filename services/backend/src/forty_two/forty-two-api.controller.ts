import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { FortyTwoApiService } from './forty-two-api.service';

@Controller('api/forty-two')
export class FortyTwoApiController {
  constructor(private readonly fortyTwoApiService: FortyTwoApiService) {}

  @Get('user/:login')
  async getUserInfo(@Param('login') login: string) {
    const userInfo = await this.fortyTwoApiService.getUserInfo(login);
    if (!userInfo) {
      throw new NotFoundException(`User ${login} not found in 42 API`);
    }
    return userInfo;
  }
}
