# Notification Gateway

A multi-channel notification gateway built with **NestJS**, **BullMQ**, and **Postgres**. One API accepts a send request, persists it, and returns `202` immediately; a separate worker process drains per-channel queues and handles delivery, retries, idempotency, and rate limiting.

Channels: **email** (SMTP / SendGrid / Mailtrap) and **SMS** (Twilio).

## Architecture

```
POST /notifications ─► API (validate, dedupe, persist) ─► Postgres
                                    │
                                    └─► BullMQ queue (email | sms)  ─► 202 Accepted
                                                      ▼
                              Worker process ─► render template ─► provider (SMTP / Twilio)
                                                      │
                                  retries · backoff · dead-letter · status tracking
```

- **API** (`src/main.ts` → `AppModule`) — HTTP only; produces jobs, never sends.
- **Worker** (`src/worker.ts` → `WorkerModule`) — consumes jobs, performs delivery.

The two run as separate processes so the API stays fast and the worker can be scaled and rate-limited independently.

## Key features

- **Async delivery** via BullMQ with exponential backoff (5 attempts).
- **Idempotency** — send the `Idempotency-Key` header; replays return the original notification, no duplicate send.
- **Retryable vs. permanent errors** — 4xx/invalid-recipient failures are marked failed immediately; transient errors retry.
- **Delivery tracking** — every attempt is recorded; `GET /notifications/:id` returns full history.
- **Heavy-handed SMS rate limiting** (see below).
- **API-key auth**, **Swagger docs at `/docs`**, validated DTOs.

## SMS rate limiting (deliberately strict)

SMS costs real money and is the easiest channel to abuse, so every SMS must clear **three** independent limits. All are env-configurable in `.env.example`; defaults are intentionally conservative:

| Layer | Default | Where |
| --- | --- | --- |
| Per-recipient | 1 SMS / hour / number | `SmsRateLimiterService` (Redis) |
| Global ceiling | 20 SMS / day total | `SmsRateLimiterService` (Redis) |
| Worker throughput | 1 SMS / 15s across the worker | BullMQ `limiter` on the SMS queue |

An SMS that exceeds a recipient/global limit is recorded as a `rate_limited` attempt and the notification ends in `rate_limited` status (it is **not** retried). Email has no such caps.

## Running locally

```bash
cp .env.example .env          # fill in SMTP_* and TWILIO_* to actually deliver
docker compose up -d          # Postgres + Redis
npm install
npm run start:dev             # API on :3000  (Swagger at /docs)
npm run start:worker:dev      # worker (separate terminal)
```

Without SMTP/Twilio credentials the gateway still runs end-to-end — sends are attempted and recorded as failed (`provider not configured`), which is enough to exercise the queue, retry, idempotency, and rate-limit paths.

### Example

```bash
curl -X POST http://localhost:3000/notifications \
  -H 'content-type: application/json' \
  -H 'x-api-key: dev-local-key-change-me' \
  -H 'Idempotency-Key: welcome-rob-1' \
  -d '{
    "channel": "sms",
    "recipient": "+15555550123",
    "template": "welcome",
    "data": { "name": "Rob", "product": "Notification Gateway" }
  }'
```

Then inspect delivery:

```bash
curl http://localhost:3000/notifications/<id> -H 'x-api-key: dev-local-key-change-me'
```

## Templates

Built-in templates live in `src/templates/templates.service.ts`: `welcome`, `verification-code`, `alert`. Each has email and SMS variants rendered with Handlebars from the request `data`.

## Notes

- `synchronize: true` (TypeORM) is enabled for dev convenience; switch to migrations before any real deployment.
- Tests: `npm test` (includes the SMS rate-limiter unit tests).
