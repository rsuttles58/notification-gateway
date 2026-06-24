import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

@Module({
  providers: [ChannelsService, EmailProvider, SmsProvider],
  exports: [ChannelsService],
})
export class ChannelsModule {}
