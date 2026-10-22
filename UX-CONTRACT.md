# UX contract

## Business evidence

User brief: Google Sheets catalog/orders, COD, delivery, owner email and WhatsApp. Follow-up: modern minimalism, Next.js, missing business details editable in Sheets.

## Canonical UI Map

| Capability     | Canonical owner               | Source of truth | Allowed variants  | Verification     |
| -------------- | ----------------------------- | --------------- | ----------------- | ---------------- |
| Select/Listbox | native select in src/main.tsx | DESIGN.md       | platform popup    | browser tests    |
| Form           | field helper, domain schema   | user brief      | delivery form     | validation tests |
| Scrollbar      | src/style.css                 | DESIGN.md       | forced colors     | browser          |
| Toast          | single live status            | UX contract     | bag feedback      | browser          |
| CRUD           | Apps Script ledger            | user brief      | pending/cancelled | gateway tests    |

## Flow ledger

Catalog, product detail, bag, checkout, receipt, WhatsApp link. Native modal dialog traps focus and makes background inert. Escape closes except during pending order. Search clear immediate. Errors retain bag and entered details.

## Money and privacy

Server ignores client prices. Lock-protected gateway recalculates stock, prices and fees. One ledger row commits reservation, order and notification outbox. Same idempotency key returns same order. Different payload cannot reuse key. Only item IDs/quantities persist in browser. Private Sheet; no public customer-data endpoint. Cancellation is an owner action in the ledger. Policies are owner-supplied.

## Locale

English; currency ISO code from Settings, default PKR. Pakistani mobile validation is initial market assumption.
