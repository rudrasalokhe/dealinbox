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
