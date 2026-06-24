import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule } from '../channels/channels.module';
import { CoreModule } from '../core.module';
import { DeliveryAttempt } from '../notifications/entities/delivery-attempt.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { EMAIL_QUEUE, SMS_QUEUE } from '../queue/queue.constants';
import { RateLimitModule } from '../ratelimit/ratelimit.module';
import { TemplatesModule } from '../templates/templates.module';
import { DeliveryService } from './delivery.service';
import { EmailProcessor } from './email.processor';
import { SmsProcessor } from './sms.processor';

@Module({
  imports: [
    CoreModule,
    TypeOrmModule.forFeature([Notification, DeliveryAttempt]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: SMS_QUEUE }),
    ChannelsModule,
    TemplatesModule,
    RateLimitModule,
  ],
  providers: [DeliveryService, EmailProcessor, SmsProcessor],
})
export class WorkerModule {}
