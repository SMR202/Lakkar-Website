import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { harness } from "./gateway-helper";
const payload = () => ({
  key: crypto.randomUUID(),
  expectedTotal: 3450,
  customer: {
    name: "Test Buyer",
    phone: "03001234567",
    address: "House 1, Test Street",
    city: "Karachi",
    zone: "karachi",
    email: "",
  },
  items: [{ id: "tray", quantity: 1 }],
});
test("gateway records order, reserves stock, retries without duplication and emails owner", () => {
  const h = harness(),
    p = payload();
  const a = h.call("order", p),
    b = h.call("order", p);
  assert.equal(a.ok, true);
  assert.equal(a.data.total, 3450);
  assert.equal(a.data.id, b.data.id);
  assert.equal(h.tables.Orders.length, 2);
  assert.equal(h.call("catalog", {}).data.products[0].stock, 1);
  h.ctx.sendPendingEmails();
  h.ctx.sendPendingEmails();
  assert.equal(h.sent.length, 1);
  assert.match(JSON.stringify(h.sent), /wa.me\/923001234567/);
});
test("unauthorized, changed idempotency payload, out of stock and closed checkout fail", () => {
  const h = harness(),
    p = payload();
  assert.equal(h.call("order", p, "wrong").ok, false);
  h.call("order", p);
  assert.equal(
    h.call("order", { ...p, customer: { ...p.customer, name: "Other" } }).ok,
    false,
  );
  h.call("order", payload());
  assert.equal(h.call("order", payload()).ok, false);
  h.tables.Settings[1][1] = "false";
  assert.equal(h.call("order", payload()).ok, false);
});
test("failed notifications remain queued and can recover", () => {
  const h = harness();
  h.call("order", payload());
  h.fail();
  h.ctx.sendPendingEmails();
  assert.equal(h.sent.length, 0);
  h.recover();
  h.ctx.sendPendingEmails();
  assert.equal(h.sent.length, 1);
});
