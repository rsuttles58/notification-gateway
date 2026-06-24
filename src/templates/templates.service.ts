import { BadRequestException, Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { RenderedContent } from '../channels/channel.interface';
import { Channel } from '../notifications/enums';

interface TemplateDef {
  email?: { subject: string; body: string };
  sms?: { body: string };
}

const TEMPLATES: Record<string, TemplateDef> = {
  welcome: {
    email: {
      subject: 'Welcome, {{name}}!',
      body: '<h1>Welcome {{name}}</h1><p>Thanks for joining {{product}}.</p>',
    },
    sms: { body: 'Welcome {{name}}! Thanks for joining {{product}}.' },
  },
  'verification-code': {
    email: {
      subject: 'Your verification code',
      body: '<p>Your code is <strong>{{code}}</strong>. It expires in 10 minutes.</p>',
    },
    sms: { body: '{{code}} is your verification code. Expires in 10 min.' },
  },
  alert: {
    email: {
      subject: 'Alert: {{title}}',
      body: '<p>{{message}}</p>',
    },
    sms: { body: 'ALERT: {{title}} — {{message}}' },
  },
};

@Injectable()
export class TemplatesService {
  render(
    template: string,
    channel: Channel,
    data: Record<string, unknown> = {},
  ): RenderedContent {
    const def = TEMPLATES[template];
    if (!def) {
      throw new BadRequestException(`Unknown template: ${template}`);
    }

    if (channel === Channel.EMAIL) {
      if (!def.email) {
        throw new BadRequestException(
          `Template "${template}" has no email variant`,
        );
      }
      return {
        subject: Handlebars.compile(def.email.subject)(data),
        body: Handlebars.compile(def.email.body)(data),
      };
    }

    if (!def.sms) {
      throw new BadRequestException(`Template "${template}" has no sms variant`);
    }
    return { body: Handlebars.compile(def.sms.body)(data) };
  }
}
