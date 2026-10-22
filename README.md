# Lakkar Home

Next.js 16, React, TypeScript. Modern mobile-first storefront using the original uploaded logo. The catalog and store settings come from a private Google Sheet through a server-only Apps Script gateway. No Google secrets reach the browser.

## Run

Use Node 22 or later. Run `npm ci`, then `npm run dev -- --port 3107`. Open http://localhost:3107. The included `.env.local` closes checkout and allows the local origin. Without a gateway, a clearly labelled sample catalog appears. Real product data can be entered later.

Production: `npm run build`, then `npm start`. Set `PUBLIC_ORIGIN` to the exact public HTTPS origin and configure the variables in `.env.example` on your host. A Node-capable Next.js host is required; static hosting cannot run checkout. Do not commit `.env.local`.

## Store controls

The native workbook is https://docs.google.com/spreadsheets/d/1PhOFMqxHTt4jx1VHDifQXwLCEKDFGgtgy3jf2oD6Ed0/edit

- **Products:** stable unique `id`, `name`, `category`, integer `price`, total `stock` capacity, HTTPS `image`, `description`, `dimensions`, `care`, `active` boolean. Images may be hosted on Cloudinary or another HTTPS host. An inactive sample row is included.
- **Delivery:** unique `id`, display `name`, integer `fee`, matching `city`. The checkout city must match the delivery area's city. Fee 0 is supported.
- **Settings:** currency, WhatsApp, private notification email, optional public email, imagery, logo, homepage copy, Instagram, delivery/returns/privacy policies, and `ordersEnabled`. Edit values, keep keys intact. New page loads read current data; refresh after editing.
- **Orders:** readable order metadata plus a system `record` cell. Never alter the system record. Owner may change `status` to `confirmed`, `fulfilled`, or `cancelled`. Cancelled orders release their stock reservation. Keep the row; deleting orders breaks replay protection and inventory history.

Stock is **total capacity**, not remaining stock: if ten pieces were offered and three non-cancelled pieces ordered, available stock is seven. Increase capacity by new quantities when restocking. Fulfilled orders still consume capacity.

## Connect Google Sheets (one-time owner setup)

1. In the workbook, open **Extensions → Apps Script** and paste `google-apps-script/Code.gs`.
2. In Apps Script Project Settings → Script properties, add `GATEWAY_SECRET` with a random 32-byte-or-longer secret. Store the same value in the hosting environment as `SHEETS_GATEWAY_SECRET`; never put it in Sheet cells or client code.
3. Run `setup` once. Authorize Spreadsheet, Mail and trigger access. It records the workbook ID and installs a five-minute notification trigger. The owner must complete Google's authorization; this repository cannot grant that access.
4. Deploy as a **Web app**, execute as the owner, allow **Anyone** to call the gateway. The gateway requires the secret on every request; the workbook itself stays private. Set the resulting `/exec` URL as `SHEETS_GATEWAY_URL` on the server. Deployment access must be allowed by the owner's Google Workspace policy.
5. Fill verified products, fees, contacts and policies. Set server `ORDERS_ENABLED=true` and Sheet `ordersEnabled=true` only when ready. The two switches prevent accidentally opening a preview. Redeploy Apps Script after changing its code.
6. Place one real smoke-test order, verify the private order row, email receipt, stock reduction and both WhatsApp links. Cancel the test order through its status cell. This live Google authorization/write/mail check remains required; local tests use a Sheets service harness.

No paid mail service or WhatsApp API is required. Email uses the owner's Google Mail quota through Apps Script. Customers explicitly open WhatsApp from the order receipt; the owner gets a customer confirmation link in the notification email. No message is automatically sent.

## Security and reliability

Prices, delivery fees and availability are recalculated inside a script lock at commit time. Browser prices/totals are rejected. Repeated requests with the same key return the original order; changed payloads cannot reuse a key. Order, inventory reservation and notification outbox commit in one row. Same-phone attempts are limited using the shared Apps Script cache, with an independent server origin check and bounded request body. For a public launch, enable the hosting provider's standard edge request limits as appropriate to expected traffic; Sheets is intended for a small catalog, not high-volume commerce.

Email is an outbox retry with at-least-once delivery semantics. A rare crash after mail send and before marking `sent` can duplicate the notification; it cannot duplicate the order. Apps Script/Google quotas or outages keep notifications pending. The receipt means order received, not owner-confirmed. No customer contact/address is stored in browser storage; only bag item IDs and quantities. Only trusted operators should access the private Sheet. Establish the store's retention and privacy policy before opening orders.

## Verification

- `npm test`: domain rules, Apps Script ledger/outbox harness and Next route → real HTTP gateway → simulated Google services.
- `npm run test:e2e`: desktop/mobile bag, search, validation, receipt, errors, keyboard, layout and axe accessibility checks. UI receipt test intercepts the API; it does not send a real order.
- `npm run build`: TypeScript and production build.
- `npm run format:check`: formatting.

Playwright uses installed Chrome by default. To use bundled Chromium, remove `channel: 'chrome'` from its config after `npx playwright install chromium`. Preview port is 3107 to avoid an unrelated application already on port 3000.

## Remaining launch setup

Owner authorization/deployment of the Apps Script gateway; hosting environment variables and public origin; verified Sheet content. No live orders or owner emails have been sent during development. Instagram throttled retrieval; the original logo was recovered from the earlier conversation. The earlier assistant's master-plan text was unavailable.
