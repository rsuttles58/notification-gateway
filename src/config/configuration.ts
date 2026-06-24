export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKey: process.env.API_KEY ?? 'dev-local-key-change-me',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5433/notifications',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  email: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'Notifications <no-reply@example.com>',
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    apiKeySid: process.env.TWILIO_API_KEY_SID ?? '',
    apiKeySecret: process.env.TWILIO_API_KEY_SECRET ?? '',
    fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
    perRecipientMax: parseInt(process.env.SMS_PER_RECIPIENT_MAX ?? '1', 10),
    perRecipientWindowSec: parseInt(
      process.env.SMS_PER_RECIPIENT_WINDOW_SEC ?? '3600',
      10,
    ),
    globalDailyMax: parseInt(process.env.SMS_GLOBAL_DAILY_MAX ?? '20', 10),
    workerMaxPerDuration: parseInt(
      process.env.SMS_WORKER_MAX_PER_DURATION ?? '1',
      10,
    ),
    workerDurationMs: parseInt(process.env.SMS_WORKER_DURATION_MS ?? '15000', 10),
  },
});
