# Deployment guide

This guide covers deploying Citizen Report to production. The reference stack uses Docker,
managed PostgreSQL, and S3-compatible object storage, fronted by a TLS-terminating reverse
proxy.

## 1. Prerequisites

- A container host (Docker/Kubernetes/ECS/Fly.io/Render).
- Managed **PostgreSQL 16** (e.g. RDS, Cloud SQL, Neon, Supabase).
- **S3-compatible** storage (AWS S3, Cloudflare R2, MinIO) with a **private** bucket.
- An **SMTP** provider for email verification (SES, Postmark, SendGrid).
- A CAPTCHA provider (hCaptcha or reCAPTCHA) — site key + secret.
- A domain with TLS (Let's Encrypt / managed certs).

## 2. Generate secrets

```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY  (must be 64 hex chars = 32 bytes)
```

Store these in your platform's secret manager, **not** in `.env` files in the repo.

## 3. Configure environment

Backend (see `backend/.env.example` for the full annotated list):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Managed Postgres connection string (use SSL). |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | From step 2. |
| `ENCRYPTION_KEY` | 64-char hex from step 2. |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` | Your object storage. |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Scoped IAM credentials (PutObject/GetObject only). |
| `S3_FORCE_PATH_STYLE` | `true` for MinIO/R2, `false` for AWS S3. |
| `CORS_ORIGIN` | Your frontend origin, e.g. `https://report.gov.example`. |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email provider. |
| `CAPTCHA_PROVIDER` / `CAPTCHA_SECRET` | `hcaptcha` or `recaptcha`. |
| `REDIS_URL` | Recommended in production for rate limiting. |
| `DATA_RETENTION_DAYS` | e.g. `365`. |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` | Set `COOKIE_SECURE=true` behind TLS. |

Frontend:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public API base, e.g. `https://report.gov.example/api`. |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | Public CAPTCHA site key. |

## 4. Database migration

The backend image runs `prisma migrate deploy` on start. To run manually:

```bash
cd backend
DATABASE_URL=... npx prisma migrate deploy
DATABASE_URL=... npm run seed    # default categories + initial admin
```

> **Change the seeded admin password immediately**, or create your admin via a one-off
> script and remove the demo credentials from the seed in production.

## 5. Build & run

### Docker Compose (single host)

```bash
cp .env.example .env   # fill with production secrets
docker compose up -d --build
```

Put a TLS-terminating reverse proxy (Caddy / Nginx / Traefik) in front:

```
report.gov.example        -> frontend:3000
report.gov.example/api    -> backend:4000
```

### Kubernetes (sketch)

- One Deployment each for `backend` and `frontend`, behind a Service + Ingress.
- Secrets via `Secret` objects / external-secrets operator.
- A `CronJob` running `npm run purge:expired` daily for retention.
- HorizontalPodAutoscaler on CPU for the backend.

## 6. Scheduled jobs

Data-retention purge (deletes media + anonymizes reports past `DATA_RETENTION_DAYS`):

```bash
cd backend && npm run purge:expired
```

Schedule it daily (cron / k8s CronJob / platform scheduler).

## 7. Post-deploy checklist

- [ ] `https://.../api/health` returns `{ status: "ok" }`.
- [ ] Swagger docs reachable (consider protecting `/api/docs` in prod).
- [ ] Registration → email verification → login works end to end.
- [ ] Anonymous report submission with photo + map location works.
- [ ] Admin can filter, view evidence (signed URLs), and change status; audit log records it.
- [ ] Rate limiting and CAPTCHA active.
- [ ] `COOKIE_SECURE=true`, HSTS present, CSP not in report-only mode.
- [ ] Backups configured for Postgres and the media bucket.
- [ ] Retention cron scheduled.
- [ ] Secrets rotated from any defaults.

## 8. Observability

- Ship backend logs (JSON) to your log aggregator.
- Alert on elevated 4xx/5xx, auth-failure spikes, and rate-limit triggers.
- Monitor DB connections and storage growth.
