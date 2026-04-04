# Changelog

## 2026-04-03

### Added
- Phase 1 / Feature 1 groundwork:
  - Added `POST /api/inbound-email` SendGrid Inbound Parse-compatible endpoint.
  - Added Claude-powered inbound email parsing helper (`claude-sonnet-4-6`) with safe fallback parsing.
  - Added automatic enquiry creation from inbound email with status `new` and initial event log entry.
  - Added creator alert email dispatch via SendGrid (`New collab request from [Brand]`).
- Added `GET /health` JSON health endpoint reporting MongoDB connection status.
- Added global API response helpers (`api_ok`, `api_error`) and budget parsing helper.

### Notes
- New endpoints and helpers are environment-variable driven (`ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`).
- Existing app behavior remains unchanged for current UI flows.

## 2026-04-04

### Added
- DealInbox CRM foundation release across creator + brand workflows.
- Added Mongo collections wiring and indexes for:
  - `brand_contacts`, `influencer_profiles`, `outreach_log`, `followup_reminders`.
- Added CRM page routes and templates:
  - Brand CRM list/detail/new
  - Influencer CRM list/detail/new
  - Reminders, Outreach Log, and DealInbox Match discover page.
- Added API routes for CRM search, wishlist, dashboard stats, smart follow-ups, and discover features.
- Added SSE AI endpoints for:
  - Brand cold-pitch generation
  - Influencer campaign-brief generation.
- Added CRM plan-gating responses (HTTP 402 with upgrade payload) for free-plan limits.
- Added notification endpoints (`/api/notifications`, `/api/notifications/mark-all-read`) and topbar bell UI.
- Added dashboard "CRM Pulse" widget.
- Added shared CRM UI styles and `static/js/crm.js` interactions.

### Notes
- AI endpoints use `ANTHROPIC_API_KEY` when configured and gracefully fallback when missing.
- CRM discover + smart follow-ups are optimized for incremental enrichment without breaking existing flows.

## 2026-04-04 (Brand Studio Expansion)

### Added
- Introduced role-based auth architecture with creator/brand paths and redirects:
  - `GET /signup` role choice
  - `GET|POST /signup/creator`
  - `GET|POST /signup/brand`
  - role-aware login redirection and route guardrails.
- Added Brand Studio app surface:
  - `templates/brand/base.html` (separate shell)
  - dashboard, discover, match, campaigns (list/new/detail), briefs, payments, invoices, analytics, team, settings, billing, notifications, lists.
- Added brand APIs and workflows:
  - `GET /api/brand/discover`
  - `POST /api/brand/match` (SSE streaming progress + ranked results)
  - brief send flow creating creator-side enquiry + brand-side campaign scaffolding.
- Added creator availability and media kit pages:
  - `GET|POST /availability`
  - `GET /media-kit`
  - `GET /@<username>/mediakit` (public)
- Expanded DB indexing for role/tiered marketplace and brand ops.
- Updated landing and upgrade surfaces with brand-specific positioning/pricing.

### Notes
- Brand-side templates intentionally use existing design tokens with blue accent for parity + side separation.
- Match endpoint emits SSE progress events and result payload for front-end streaming UX.
