export const EMAIL_QUEUE = 'email';
export const SMS_QUEUE = 'sms';
export const DELIVER_JOB = 'deliver';

export const DEFAULT_JOB_OPTS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};
