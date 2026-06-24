import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

export interface RateLimitDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Deliberately strict, multi-layer SMS throttle. SMS costs real money and is the
 * easiest channel to abuse, so every send must clear BOTH a per-recipient limit
 * and a global daily ceiling. Worker-level throughput throttling is configured
 * separately on the BullMQ SMS queue (see sms.processor.ts).
 */
@Injectable()
export class SmsRateLimiterService {
  private readonly logger = new Logger(SmsRateLimiterService.name);
  private readonly perRecipientMax: number;
  private readonly perRecipientWindowSec: number;
  private readonly globalDailyMax: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    const sms = config.get('sms');
    this.perRecipientMax = sms.perRecipientMax;
    this.perRecipientWindowSec = sms.perRecipientWindowSec;
    this.globalDailyMax = sms.globalDailyMax;
  }

  async check(recipient: string): Promise<RateLimitDecision> {
    const recipientKey = `sms:rl:recipient:${recipient}`;
    const recipientCount = await this.redis.incr(recipientKey);
    if (recipientCount === 1) {
      await this.redis.expire(recipientKey, this.perRecipientWindowSec);
    }
    if (recipientCount > this.perRecipientMax) {
      this.logger.warn(`Per-recipient SMS limit hit for ${recipient}`);
      return {
        allowed: false,
        reason: `per-recipient limit of ${this.perRecipientMax} per ${this.perRecipientWindowSec}s exceeded`,
      };
    }

    const day = new Date().toISOString().slice(0, 10);
    const globalKey = `sms:rl:global:${day}`;
    const globalCount = await this.redis.incr(globalKey);
    if (globalCount === 1) {
      await this.redis.expire(globalKey, 86400);
    }
    if (globalCount > this.globalDailyMax) {
      this.logger.warn(`Global daily SMS ceiling (${this.globalDailyMax}) hit`);
      return {
        allowed: false,
        reason: `global daily ceiling of ${this.globalDailyMax} exceeded`,
      };
    }

    return { allowed: true };
  }
}
