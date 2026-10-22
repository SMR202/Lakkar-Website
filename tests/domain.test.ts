import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, orderSchema, whatsappLink } from "../server/domain";
import { sample } from "../server/sample";
test("server calculates authoritative prices and delivery", () => {
  const q = quote(sample, [{ id: "tray", quantity: 2 }], "karachi");
  assert.equal(q.total, 6650);
  assert.equal(q.delivery, 250);
});
test("duplicate item lines cannot bypass stock", () =>
  assert.throws(() =>
    quote(
      sample,
      [
        { id: "tray", quantity: 5 },
        { id: "tray", quantity: 5 },
      ],
      "karachi",
    ),
  ));
test("rejects unknown SKU, unsupported area and excess quantity", () => {
  for (const [id, quantity, zone] of [
    ["fake", 1, "karachi"],
    ["tray", 1, "other"],
    ["tray", 30, "karachi"],
  ] as const)
    assert.throws(() => quote(sample, [{ id, quantity }], zone));
});
test("order rejects client totals and malformed customer", () => {
  assert.equal(
    orderSchema.safeParse({
      key: crypto.randomUUID(),
      total: 1,
      customer: {},
      items: [{ id: "tray", quantity: -1 }],
    }).success,
    false,
  );
});
test("WhatsApp links are encoded and require real contact", () => {
  assert.equal(whatsappLink("", "hello"), null);
  assert.match(
    whatsappLink("923001234567", "hello & order #1")!,
    /hello%20%26%20order%20%231/,
  );
});
