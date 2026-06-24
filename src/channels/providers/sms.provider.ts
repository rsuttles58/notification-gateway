import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';
import {
  NotificationChannel,
  PermanentDeliveryError,
  RenderedContent,
  SendResult,
} from '../channel.interface';

@Injectable()
export class SmsProvider implements NotificationChannel {
  private readonly client: Twilio | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const sms = config.get('sms');
    this.from = sms.fromNumber;
    this.client =
      sms.accountSid && sms.authToken
        ? twilio(sms.accountSid, sms.authToken)
        : null;
  }

  async send(recipient: string, content: RenderedContent): Promise<SendResult> {
    if(!this.from) {
      throw new PermanentDeliveryError('From number is not configured');
    }
    if (!this.client) {
      throw new PermanentDeliveryError('Twilio is not configured');
    }
    try {
      const msg = await this.client.messages.create({
        from: this.from,
        to: recipient,
        body: content.body,
      });
      return { providerId: msg.sid, raw: msg.status };
    } catch (err: any) {
      if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
        throw new PermanentDeliveryError(`${err.code}: ${err.message}`);
      }
      throw err;
    }
  }
}
