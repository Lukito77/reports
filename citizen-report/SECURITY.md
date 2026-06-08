# Security best practices & threat model

This document describes the security controls implemented in Citizen Report and the
threats they mitigate. Treat it as a checklist when hardening for production.

## Principles

1. **Evidence, not enforcement.** The platform never decides guilt or issues penalties.
   It only collects evidence and routes it to authorized humans. This is enforced at the
   data model (no "fine" entity) and the API (no automated penalty endpoints).
2. **Least privilege.** Every role gets the minimum access required (see RBAC).
3. **Defense in depth.** Multiple overlapping controls — no single point of failure.

## Authentication & sessions

- Passwords hashed with **bcrypt** (cost 12). Plaintext is never stored or logged.
- **JWT access tokens** (short-lived, 15 min) carry `sub`, `role`, `tokenVersion`.
- **Refresh tokens** are random opaque strings, stored **hashed** in the DB, delivered as
  `httpOnly`, `Secure`, `SameSite=Strict` cookies, and **rotated** on every use. Reuse of
  a revoked token revokes the whole family (token-theft detection).
- Logout and password change bump `tokenVersion`, invalidating all existing access tokens.
- Email verification required before a registered user can submit non-anonymous reports.

## Authorization (RBAC)

Roles: `CITIZEN`, `MODERATOR`, `ADMIN`.

- Route-level guards (`requireAuth`, `requireRole`) enforce access.
- Object-level checks ensure users only read/modify their **own** reports; admins/mods see
  all. Status transitions are validated server-side against an allowed state machine.

## Input handling

- **All** request bodies/queries validated with **Zod** schemas before reaching handlers.
- **SQL injection:** all DB access goes through **Prisma** (parameterized queries); no raw
  string concatenation. No raw SQL is exposed to user input.
- **XSS:** API returns JSON only; the React frontend escapes by default. A strict
  **Content-Security-Policy** and `X-Content-Type-Options: nosniff` are set via Helmet.
- **CSRF:** the API is authenticated with `Authorization: Bearer` access tokens, which are
  **not** sent automatically by browsers — so application endpoints are not CSRF-able. The
  only cookie is the refresh token, scoped to `path=/api/auth` and set `SameSite=Strict`,
  which blocks cross-site use. If you later move to cookie-based session auth for the API,
  add a double-submit CSRF token before doing so.

## File upload safety

- Enforced **max size** per file and per request (`MAX_UPLOAD_MB`).
- **MIME allow-list** (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`).
- **Magic-byte sniffing** (`file-type`) — the real content type must match the claimed one,
  defeating disguised executables / polyglots.
- Filenames are discarded; stored objects use random UUID keys.
- Media stored in a **private** bucket; served only through short-lived signed URLs.
- EXIF is parsed server-side in a sandboxed step; only GPS/time is extracted, the rest
  (including any embedded payloads) is stripped on re-encode.
- Faces are auto-blurred before evidence is shown to reviewers.

## Network & transport

- **Helmet** sets HSTS, CSP, frame-guard, no-sniff, referrer policy.
- **CORS** locked to the configured `CORS_ORIGIN`.
- **Rate limiting:** global limiter + stricter limiters on `/auth/*` (brute-force) and
  `/reports` POST (spam). Backed by an in-memory store in dev, Redis in production.
- **CAPTCHA** (hCaptcha/reCAPTCHA) required on registration and anonymous report
  submission to deter automated abuse.

## Data protection

- Sensitive fields (reporter contact for anonymous reports, detected plate text) are
  **encrypted at rest** with AES-256-GCM using `ENCRYPTION_KEY`.
- Database credentials, JWT secrets, and the encryption key come from environment/secret
  manager — never committed.
- Audit log is **append-only**; admin actions (approve/reject/request-info/view-evidence)
  are recorded with actor, timestamp, IP, and before/after state.

## Operational

- Dependencies pinned; run `npm audit` / Dependabot.
- Structured logging (no secrets/PII in logs).
- Health endpoint (`/api/health`) for orchestration; readiness gated on DB connectivity.
- Principle of rotating secrets: all secrets are externally configurable.

## Reporting a vulnerability

Email `security@citizen-report.example` with details. Please do not open public issues for
security problems.
