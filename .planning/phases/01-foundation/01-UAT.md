---
status: testing
phase: 01-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-03-20T02:00:00Z
updated: 2026-03-20T02:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 10
name: Visual Check
expected: |
  On any auth page (/login or /signup) and on /dashboard: background is a warm off-white (not pure white), headings use a serif font (Playfair Display), and the primary submit button has a terracotta/rust-red color (not default blue).
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `supabase db reset` to reset and re-apply all migrations, then `npm run dev` to start fresh. The server should boot without errors, all 6 migrations should apply cleanly, and visiting http://localhost:3000 should return a response (redirect to /login is fine).
result: pass

### 2. Unauthenticated Redirect
expected: While logged out, visit http://localhost:3000/dashboard — you should be immediately redirected to /login.
result: pass

### 3. Signup Flow
expected: Visit /signup. Enter a new email and password (6+ chars). Submit. You should be redirected to /onboarding with no errors.
result: pass

### 4. Onboarding Flow
expected: On /onboarding, enter a wedding name (e.g. "Aaron & Sam"). Submit. You should be redirected to /dashboard.
result: pass

### 5. Dashboard Renders
expected: On /dashboard, you should see the Twogether nav header and some placeholder dashboard content. No error page, no redirect loop.
result: pass

### 6. Session Persistence
expected: While on /dashboard, refresh the browser. You should remain on /dashboard — not redirected to /login.
result: pass

### 7. Onboarding Guard
expected: While logged in with a wedding, navigate directly to /onboarding. You should be redirected to /dashboard (already have a wedding).
result: pass

### 8. Auth-Page Guard
expected: While logged in, navigate directly to /login. You should be redirected to /dashboard (already authenticated).
result: pass

### 9. Login Flow
expected: Log out (or open a private/incognito window). Visit /login. Enter the credentials you created in test 3. Submit. You should be redirected to /dashboard.
result: pass

### 10. Visual Check
expected: On any auth page (/login or /signup) and on /dashboard: background is a warm off-white (not pure white), headings use a serif font (Playfair Display), and the primary submit button has a terracotta/rust-red color (not default blue).
result: [pending]

## Summary

total: 10
passed: 9
issues: 0
pending: 1
skipped: 0

## Gaps

[none yet]
