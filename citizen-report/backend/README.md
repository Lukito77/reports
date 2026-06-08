# Citizen Report — Backend API

Express + TypeScript + Prisma + PostgreSQL. Feature-sliced modules, Zod validation,
JWT + rotating refresh tokens, RBAC, audited admin actions, S3 media storage, and
AI-assist hooks.

## Run

```bash
npm install
cp .env.example .env          # fill in secrets
npx prisma generate
npx prisma db push            # or: npx prisma migrate dev  (creates migration files)
npm run seed                  # default categories + demo admin
npm run dev                   # http://localhost:4000
```

Interactive docs: <http://localhost:4000/api/docs>

## Layout

```
src/
  config/env.ts          Validated env config (fails fast)
  lib/                   prisma, logger, jwt, crypto (AES-GCM), storage (S3), mailer, audit
  middleware/            auth, rbac guards, validate (Zod), rateLimit, upload, captcha, error
  modules/
    auth/                register, login, refresh-rotation, verify-email, reset
    reports/             submission (type-sniff, EXIF, blur, tamper, hash), read with signed URLs
    admin/               filtered listing, status state-machine, role mgmt, audit log, stats
    users/               profile, GDPR export & erasure
    ai/                  plate OCR, face blur, tamper detection, summaries (advisory)
  docs/openapi.ts        OpenAPI 3 spec
  jobs/purgeExpired.ts   Retention purge (run on a schedule)
  app.ts / index.ts      App wiring + server bootstrap
```

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Health/readiness |
| POST | `/api/auth/register` | — | Create account (+ verification email) |
| POST | `/api/auth/login` | — | Login → access token + refresh cookie |
| POST | `/api/auth/refresh` | cookie | Rotate refresh token |
| POST | `/api/auth/logout` | cookie | Revoke session |
| POST | `/api/auth/verify-email` | — | Verify email with token |
| POST | `/api/auth/forgot-password` | — | Request reset link |
| POST | `/api/auth/reset-password` | — | Set new password |
| GET | `/api/reports/categories` | — | List categories |
| POST | `/api/reports` | optional | Submit report (multipart `media[]`) |
| GET | `/api/reports/mine` | citizen | List own reports |
| GET | `/api/reports/:id` | owner/staff | Get one report (signed media URLs) |
| GET | `/api/users/me` | user | Profile |
| GET | `/api/users/me/export` | user | GDPR data export |
| DELETE | `/api/users/me` | user | GDPR erasure |
| GET | `/api/admin/reports` | staff | Filter all reports |
| GET | `/api/admin/reports/:id` | staff | View evidence (audited) |
| PATCH | `/api/admin/reports/:id/status` | staff | Approve/reject/info/close (audited) |
| GET | `/api/admin/audit` | staff | Read audit log |
| GET | `/api/admin/stats` | staff | Counts by status |
| PATCH | `/api/admin/users/:userId/role` | admin | Change a user's role |
| POST | `/api/ai/analyze` | staff | Plate OCR + tamper on an image |

## Notes

- **No automated enforcement.** `APPROVED` only forwards a report for a human decision.
- Refresh tokens are stored hashed, rotated on use, with family-wide reuse detection.
- Media lives in a private bucket; clients receive short-lived signed URLs. Citizens get
  the face-blurred derivative; staff get originals.
- Swap the AI provider in `modules/ai/ai.service.ts` (`AiProvider`) for real OCR/vision.
