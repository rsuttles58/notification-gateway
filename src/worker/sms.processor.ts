import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SMS_QUEUE } from '../queue/queue.constants';
import { DeliveryService } from './delivery.service';

/**
 * Throughput throttle: process at most N SMS jobs per duration across the whole
 * worker, on top of the per-recipient and global-daily caps enforced in
 * SmsRateLimiterService. Read from env here because @Processor options are static.
 */
@Processor(SMS_QUEUE, {
  concurrency: 1,
  limiter: {
    max: parseInt(process.env.SMS_WORKER_MAX_PER_DURATION ?? '1', 10),
    duration: parseInt(process.env.SMS_WORKER_DURATION_MS ?? '15000', 10),
  },
})
export class SmsProcessor extends WorkerHost {
  constructor(private readonly delivery: DeliveryService) {
    super();
  }

  async process(job: Job<{ notificationId: string }>): Promise<void> {
    await this.delivery.deliver(job);
  }
}
