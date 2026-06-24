import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  NotificationChannel,
  PermanentDeliveryError,
  RenderedContent,
  SendResult,
} from '../channel.interface';

@Injectable()
export class EmailProvider implements NotificationChannel {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const email = config.get('email');
    this.from = email.from;
    this.transporter = email.host
      ? nodemailer.createTransport({
          host: email.host,
          port: email.port,
          secure: email.port === 465,
          auth: email.user ? { user: email.user, pass: email.pass } : undefined,
        })
      : null;
  }

  async send(recipient: string, content: RenderedContent): Promise<SendResult> {
    if (!this.transporter) {
      throw new PermanentDeliveryError('SMTP is not configured');
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: recipient,
        subject: content.subject ?? '(no subject)',
        html: content.body,
      });
      
      return { providerId: info.messageId, raw: info.response };
    } catch (err: any) {
      if (typeof err?.responseCode === 'number' && err.responseCode < 500) {
        throw new PermanentDeliveryError(err.message);
      }
      throw err;
    }
  }
}
