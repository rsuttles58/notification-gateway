import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  DEFAULT_JOB_OPTS,
  DELIVER_JOB,
  EMAIL_QUEUE,
  SMS_QUEUE,
} from '../queue/queue.constants';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { Channel, NotificationStatus } from './enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(SMS_QUEUE) private readonly smsQueue: Queue,
  ) {}

  async enqueue(
    dto: CreateNotificationDto,
    idempotencyKey?: string,
  ): Promise<Notification> {
    if (idempotencyKey) {
      const existing = await this.repo.findOne({ where: { idempotencyKey } });
      if (existing) return existing;
    }

    const notification = await this.repo.save(
      this.repo.create({
        channel: dto.channel,
        recipient: dto.recipient,
        template: dto.template,
        data: dto.data ?? {},
        status: NotificationStatus.QUEUED,
        idempotencyKey: idempotencyKey ?? null,
      }),
    );

    const queue =
      dto.channel === Channel.SMS ? this.smsQueue : this.emailQueue;
    await queue.add(
      DELIVER_JOB,
      { notificationId: notification.id },
      { jobId: notification.id, ...DEFAULT_JOB_OPTS },
    );

    return notification;
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.repo.findOne({
      where: { id },
      relations: { attempts: true },
      order: { attempts: { attemptNumber: 'ASC' } },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }
}
