# Citizen Report

A modern, production-ready platform that lets citizens submit photo/video evidence of
potential public infractions (illegal parking, blocked sidewalks, abandoned vehicles,
littering, vandalism, etc.) and forwards that evidence to authorized administrators for
review.

> **Important — legal due process by design.**
> Citizen Report **does not** automatically issue fines or determine guilt. It is an
> evidence-collection and case-management tool. Only authorized government officials /
> administrators can review reports and decide whether enforcement action is appropriate.
> Every administrative action is recorded in an immutable audit log.

---

## Table of contents

- [Architecture](#architecture)
- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API documentation](#api-documentation)
- [Security](#security)
- [Privacy & compliance](#privacy--compliance)
- [Deployment](#deployment)
- [License](#license)

---

## Architecture

```
                       ┌──────────────────────────┐
                       │   Next.js Frontend (SSR)  │
                       │  React + TS + Tailwind CSS │
                       └────────────┬──────────────┘
                                    │  HTTPS / JSON
                                    ▼
                       ┌──────────────────────────┐
                       │   Express API (Node + TS) │
                       │  Auth · RBAC · Validation  │
                       │  Rate limit · CSRF · CORS  │
                       └───┬───────────┬──────────┬─┘
                           │           │          │
              ┌────────────▼──┐  ┌─────▼─────┐ ┌──▼─────────────┐
              │ PostgreSQL    │  │ S3 / MinIO │ │  AI service     │
              │ (Prisma ORM)  │  │ media blobs│ │ OCR · face blur │
              └───────────────┘  └────────────┘ │ tamper · summary│
                                                 └─────────────────┘
```

All components are containerized and orchestrated with `docker-compose`.

---

## Feature overview

| Area | Capabilities |
| --- | --- |
| **Public portal** | Multi-photo + optional video upload, interactive map location picker, automatic GPS extraction from EXIF, date/time capture, category selection, rich description, anonymous **or** registered submission. |
| **Accounts** | Registration, login, email verification, JWT access + refresh tokens, personal dashboard, per-report status tracking. |
| **Admin** | View/filter all reports (by category, location, date, status), inspect evidence, approve / reject / request-info, immutable audit log. |
| **AI assistance** | License-plate OCR, automatic face blurring, image-manipulation detection, auto-generated report summaries (pluggable provider interface). |
| **Privacy** | GDPR-style data export & erasure, configurable retention, mandatory consent notice, encrypted-at-rest sensitive fields, signed/time-limited media URLs. |
| **Security** | RBAC, rate limiting, CAPTCHA, strict upload validation (magic-byte + size + MIME), Helmet, CSRF, parameterized queries (Prisma), input validation (Zod). |

---

## Tech stack

- **Frontend:** Next.js (App Router, v16) · React 19 · TypeScript · Tailwind CSS · React-Leaflet · exifr
- **Backend:** Node.js · Express · TypeScript · Zod · Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT access tokens + rotating refresh tokens (httpOnly cookies)
- **Storage:** S3-compatible (AWS S3 / MinIO) via `@aws-sdk/client-s3`
- **AI:** Provider interface with a local stub + hooks for cloud OCR/vision
- **Infra:** Docker + docker-compose, Swagger/OpenAPI docs

See [`backend/`](./backend) and [`frontend/`](./frontend) for details.

---

## Project structure

```
citizen-report/
├── docker-compose.yml        # Postgres + MinIO + backend + frontend
├── .env.example              # Root compose env
├── README.md
├── SECURITY.md               # Security best practices & threat model
├── DEPLOYMENT.md             # Production deployment guide
├── backend/                  # Express + Prisma API
│   ├── prisma/schema.prisma  # Full database schema
│   ├── src/
│   │   ├── modules/          # auth, reports, admin, users, ai (feature-sliced)
│   │   ├── middleware/       # auth, rbac, rate-limit, upload, validation, errors
│   │   ├── lib/              # prisma, jwt, storage, mailer, crypto, logger
│   │   └── app.ts            # Express app wiring
│   └── Dockerfile
└── frontend/                 # Next.js app
    ├── src/app/              # Routes (App Router)
    ├── src/components/       # MapPicker, PhotoUpload, ConsentNotice, …
    └── Dockerfile
```

---

## Quick start (Docker)

```bash
cd citizen-report
cp .env.example .env                 # adjust secrets for production!
docker compose up --build
```

Then open:

- Frontend: <http://localhost:3000>
- API: <http://localhost:4000/api>
- API docs (Swagger): <http://localhost:4000/api/docs>
- MinIO console: <http://localhost:9001> (user/pass from `.env`)

The backend container runs `prisma migrate deploy` and seeds default categories +
a demo admin on first boot.

**Default demo admin** (change immediately in production):
`admin@citizen-report.local` / `ChangeMe!2024`

---

## Local development

You need Node 20+, pnpm/npm, and a running PostgreSQL + S3 (or `docker compose up db minio`).

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev          # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

---

## Environment variables

Each service ships an annotated `.env.example`. Never commit real secrets.
See [root `.env.example`](./.env.example), [`backend/.env.example`](./backend/.env.example),
and [`frontend/.env.example`](./frontend/.env.example).

---

## Database schema

The full schema lives in [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).
Core models: `User`, `RefreshToken`, `Report`, `MediaAsset`, `Category`, `AuditLog`,
`AiAnalysis`, `ConsentRecord`. See the file for fields, enums, and relations.

---

## API documentation

Interactive OpenAPI/Swagger docs are served at `/api/docs`. A concise endpoint list is
in [`backend/README.md`](./backend/README.md).

---

## Security

See [SECURITY.md](./SECURITY.md) for the threat model and the full list of controls
(RBAC, rate limiting, CAPTCHA, upload validation, XSS/CSRF/SQLi protections, encryption).

---

## Privacy & compliance

- Mandatory consent notice before submission, recorded per report.
- GDPR endpoints: data export (`GET /api/users/me/export`) and erasure
  (`DELETE /api/users/me`).
- Configurable retention (`DATA_RETENTION_DAYS`) with a scheduled purge job.
- Media stored privately; access only via short-lived signed URLs.
- Faces auto-blurred and sensitive fields encrypted at rest.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment (managed Postgres, S3,
TLS, secrets, scaling, and the retention cron job).

---

## License

MIT — provided as a reference implementation. Review and harden before production use.
