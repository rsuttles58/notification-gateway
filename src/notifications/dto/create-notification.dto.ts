import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Channel } from '../enums';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

function IsRecipientForChannel(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isRecipientForChannel',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const channel = (args.object as CreateNotificationDto).channel;
          if (typeof value !== 'string') return false;
          if (channel === Channel.EMAIL) return EMAIL_RE.test(value);
          if (channel === Channel.SMS) return E164_RE.test(value);
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          const channel = (args.object as CreateNotificationDto).channel;
          return channel === Channel.SMS
            ? 'recipient must be an E.164 phone number (e.g. +15555550123) for SMS'
            : 'recipient must be a valid email address for email';
        },
      },
    });
}

export class CreateNotificationDto {
  @IsEnum(Channel)
  channel: Channel;

  @IsString()
  @IsRecipientForChannel()
  recipient: string;

  @IsString()
  template: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
