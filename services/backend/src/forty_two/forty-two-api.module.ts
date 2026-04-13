import { Module } from '@nestjs/common';
import { FortyTwoApiService } from './forty-two-api.service';
import { FortyTwoApiController } from './forty-two-api.controller';

@Module({
  providers: [FortyTwoApiService],
  controllers: [FortyTwoApiController],
  exports: [FortyTwoApiService],
})
export class FortyTwoApiModule {}
