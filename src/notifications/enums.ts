export enum Channel {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationStatus {
  QUEUED = 'queued',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RATE_LIMITED = 'rate_limited',
}

export enum AttemptResult {
  SUCCESS = 'success',
  RETRYABLE_ERROR = 'retryable_error',
  PERMANENT_ERROR = 'permanent_error',
  RATE_LIMITED = 'rate_limited',
}
