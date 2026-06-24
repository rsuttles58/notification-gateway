import { Module } from '@nestjs/common';
import { redisProvider } from './redis.provider';
import { SmsRateLimiterService } from './sms-rate-limiter.service';

@Module({
  providers: [redisProvider, SmsRateLimiterService],
  exports: [SmsRateLimiterService],
})
export class RateLimitModule {}
