import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import {
  NotificationChannel,
  PermanentDeliveryError,
} from '../channels/channel.interface';
import { ChannelsService } from '../channels/channels.service';
import { DeliveryAttempt } from '../notifications/entities/delivery-attempt.entity';
import { Notification } from '../notifications/entities/notification.entity';
import {
  AttemptResult,
  Channel,
  NotificationStatus,
} from '../notifications/enums';
import { SmsRateLimiterService } from '../ratelimit/sms-rate-limiter.service';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(DeliveryAttempt)
    private readonly attempts: Repository<DeliveryAttempt>,
    private readonly channels: ChannelsService,
    private readonly templates: TemplatesService,
    private readonly smsRateLimiter: SmsRateLimiterService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeliveryService.name);
  }

  async deliver(job: Job<{ notificationId: string }>): Promise<void> {
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;
    const notification = await this.notifications.findOneByOrFail({
      id: job.data.notificationId,
    });
    const log = this.logger.logger.child({
      notificationId: notification.id,
      channel: notification.channel,
      attempt: attemptNumber,
    });
    log.info('processing delivery');

    if (notification.channel === Channel.SMS) {
      const decision = await this.smsRateLimiter.check(notification.recipient);
      if (!decision.allowed) {
        log.warn({ reason: decision.reason }, 'sms rate limited, dropping');
        await this.record(notification, attemptNumber, AttemptResult.RATE_LIMITED, decision.reason);
        await this.finalize(notification, NotificationStatus.RATE_LIMITED, decision.reason ?? null);
        return;
      }
    }

    const content = this.templates.render(
      notification.template,
      notification.channel,
      notification.data,
    );
    const channel: NotificationChannel = this.channels.resolve(notification.channel);

    try {
      const result = await channel.send(notification.recipient, content);
      log.info({ providerId: result.providerId }, 'delivered');
      await this.record(notification, attemptNumber, AttemptResult.SUCCESS, result.raw);
      await this.finalize(notification, NotificationStatus.DELIVERED, null);
    } catch (err) {
      if (err instanceof PermanentDeliveryError) {
        log.warn({ error: err.message }, 'permanent failure, not retrying');
        await this.record(notification, attemptNumber, AttemptResult.PERMANENT_ERROR, err.message);
        await this.finalize(notification, NotificationStatus.FAILED, err.message);
        return;
      }
      const message = (err as Error).message;
      await this.record(notification, attemptNumber, AttemptResult.RETRYABLE_ERROR, message);
      if (attemptNumber >= maxAttempts) {
        log.error({ error: message, maxAttempts }, 'delivery failed after max attempts');
        await this.finalize(notification, NotificationStatus.FAILED, message);
      } else {
        log.warn({ error: message, maxAttempts }, 'retryable failure, will retry');
      }
      throw err;
    }
  }

  private async record(
    notification: Notification,
    attemptNumber: number,
    result: AttemptResult,
    providerResponse?: string | null,
  ): Promise<void> {
    await this.attempts.save(
      this.attempts.create({
        notification,
        attemptNumber,
        result,
        providerResponse: providerResponse ?? null,
      }),
    );
  }

  private async finalize(
    notification: Notification,
    status: NotificationStatus,
    failureReason: string | null,
  ): Promise<void> {
    notification.status = status;
    notification.failureReason = failureReason;
    await this.notifications.save(notification);
  }
}
