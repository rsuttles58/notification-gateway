import { Injectable } from '@nestjs/common';
import { Channel } from '../notifications/enums';
import { NotificationChannel } from './channel.interface';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly email: EmailProvider,
    private readonly sms: SmsProvider,
  ) {}

  resolve(channel: Channel): NotificationChannel {
    return channel === Channel.SMS ? this.sms : this.email;
  }
}
