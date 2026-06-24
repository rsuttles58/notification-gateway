import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EMAIL_QUEUE } from '../queue/queue.constants';
import { DeliveryService } from './delivery.service';

@Processor(EMAIL_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  constructor(private readonly delivery: DeliveryService) {
    super();
  }

  async process(job: Job<{ notificationId: string }>): Promise<void> {
    await this.delivery.deliver(job);
  }
}
