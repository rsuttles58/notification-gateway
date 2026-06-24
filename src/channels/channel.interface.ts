export interface RenderedContent {
  subject?: string;
  body: string;
}

export interface SendResult {
  providerId?: string;
  raw?: string;
}

export interface NotificationChannel {
  send(recipient: string, content: RenderedContent): Promise<SendResult>;
}

/** Thrown for failures that must NOT be retried (bad recipient, 4xx, missing config). */
export class PermanentDeliveryError extends Error {}
