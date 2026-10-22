# Verification

Verified 22 October 2026.

- Next.js production build and TypeScript: passed.
- Domain, Apps Script service harness, and Next route → HTTP gateway integration: 9 tests passed.
- Desktop Chrome and emulated mobile Chrome: 8 browser tests passed.
- Browser coverage: search/no results, clear, bag persistence, quantity, delivery totals, closed preview checkout, live-mode form validation, receipt/WhatsApp, network errors, and price-change recovery with retained customer fields.
- Axe checks in checkout: zero violations at both tested viewport sizes. This is an automated check, not a claim of a full manual accessibility certification.
- Formatting: passed. Dependency audit: zero vulnerabilities reported. Premium UI static audit: zero findings.
- Impeccable review: `ship` for the reviewed recovery fix; modern minimal visual direction retained.

The integration harness uses the actual Apps Script source with simulated Google services. The receipt UI test intercepts its API. No live Google order write, owner email, or WhatsApp message was sent. Actual Google authorization and an owner-controlled smoke test remain required before opening orders.

The native Google Sheet was created through the connected Google Drive account and verified by metadata and bounded API readback. Its browser view requires Google sign-in, so native visual verification used API formatting readback alongside local workbook rendering.
