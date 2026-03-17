# QR Nexus — Advanced Smart QR Ecosystem Platform

Problem Statement: **RT-4 — Advanced Smart QR Code Ecosystem Platform**.

## What this project does

- Create dynamic QR codes with human-readable names and unique slugs.
- Manage all QR codes from a single dashboard (name, slug, destination URL, status).
- Enable or disable any QR instantly (security control for suspicious or expired links).
- Track scans using a dedicated `qr_scans` table for analytics and future dashboards.

## How it works

- Frontend: Next.js App Router with a single-page dashboard for creating and listing QR codes.
- Storage: Supabase Postgres with `qr_codes` and `qr_scans` tables.
- Redirects: Each QR is accessed via `/q/[slug]`, where the app:
  - Checks if the QR is active and not expired.
  - Records a scan entry in `qr_scans`.
  - Redirects the user to the configured destination URL.

## Why this is beyond basic QR generators

- Dynamic management: Destination URL and status can be changed without regenerating the QR.
- Security awareness: Admin can instantly disable risky links (phishing, expired campaigns).
- Analytics-ready: Every scan is stored with a timestamp for future analytics dashboards.

## Tech stack

- Next.js (App Router)
- React
- Supabase (Postgres)
- Tailwind CSS (for UI styling)

## Running locally

```bash
npm install
npm run dev
