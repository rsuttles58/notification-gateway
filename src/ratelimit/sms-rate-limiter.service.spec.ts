import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { SmsRateLimiterService } from './sms-rate-limiter.service';

function fakeRedis(): Redis {
  const counts = new Map<string, number>();
  return {
    incr: jest.fn(async (key: string) => {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    }),
    expire: jest.fn(async () => 1),
  } as unknown as Redis;
}

function service(redis: Redis, overrides: Partial<Record<string, number>> = {}) {
  const config = {
    get: () => ({
      perRecipientMax: 1,
      perRecipientWindowSec: 3600,
      globalDailyMax: 3,
      ...overrides,
    }),
  } as unknown as ConfigService;
  return new SmsRateLimiterService(redis, config);
}

describe('SmsRateLimiterService', () => {
  it('allows the first SMS to a recipient', async () => {
    const svc = service(fakeRedis());
    expect((await svc.check('+15555550123')).allowed).toBe(true);
  });

  it('blocks a second SMS to the same recipient within the window', async () => {
    const svc = service(fakeRedis());
    await svc.check('+15555550123');
    const decision = await svc.check('+15555550123');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/per-recipient/);
  });

  it('enforces the global daily ceiling across distinct recipients', async () => {
    const svc = service(fakeRedis(), { globalDailyMax: 2 });
    expect((await svc.check('+15555550001')).allowed).toBe(true);
    expect((await svc.check('+15555550002')).allowed).toBe(true);
    const third = await svc.check('+15555550003');
    expect(third.allowed).toBe(false);
    expect(third.reason).toMatch(/global daily/);
  });
});
