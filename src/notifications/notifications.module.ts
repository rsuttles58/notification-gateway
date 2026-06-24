import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EMAIL_QUEUE, SMS_QUEUE } from '../queue/queue.constants';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { DeliveryAttempt } from './entities/delivery-attempt.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeliveryAttempt]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: SMS_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ApiKeyGuard],
})
export class NotificationsModule {}
