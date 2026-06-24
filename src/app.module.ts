import { Module } from '@nestjs/common';
import { CoreModule } from './core.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [CoreModule, NotificationsModule],
  controllers: [HealthController],
})
export class AppModule {}
