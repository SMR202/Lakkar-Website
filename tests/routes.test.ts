import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { harness } from "./gateway-helper";
import { POST } from "../app/api/orders/route";
import { GET } from "../app/api/catalog/route";
test("Next checkout route through HTTP gateway to ledger and notification outbox", async () => {
  const h = harness();
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    const r = JSON.parse(body);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(h.call(r.action, r.payload, r.secret)));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const old = { ...process.env };
  process.env.SHEETS_GATEWAY_URL = `http://127.0.0.1:${port}`;
  process.env.SHEETS_GATEWAY_SECRET = "secret";
  process.env.PUBLIC_ORIGIN = "http://localhost:3107";
  process.env.ORDERS_ENABLED = "true";
  const p = {
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
  };
  const request = (data: unknown, origin = "http://localhost:3107") =>
    new Request("http://localhost:3107/api/orders", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  try {
    assert.equal(
      (await POST(request(p, "https://attacker.example"))).status,
      403,
    );
    assert.equal((await POST(request({ ...p, total: 1 }))).status, 400);
    const oversized = new Request("http://localhost:3107/api/orders", {
      method: "POST",
      headers: { origin: "http://localhost:3107" },
      body: "x".repeat(17000),
    });
    assert.equal((await POST(oversized)).status, 413);
    const stale = await POST(
      request({ ...p, key: crypto.randomUUID(), expectedTotal: 1 }),
    );
    assert.equal(stale.status, 409);
    assert.equal(h.tables.Orders.length, 1);
    const c = await GET();
    assert.equal(c.status, 200);
    assert.equal((await c.json()).demo, false);
    const a = await POST(request(p));
    assert.equal(a.status, 201);
    const order = await a.json();
    assert.equal(order.total, 3450);
    assert.match(order.whatsapp, /wa.me\/923001234567/);
    const retry = await POST(request(p));
    assert.equal((await retry.json()).id, order.id);
    assert.equal(h.tables.Orders.length, 2);
    h.ctx.sendPendingEmails();
    assert.equal(h.sent.length, 1);
    const wrongCity = await POST(
      request({
        ...p,
        key: crypto.randomUUID(),
        expectedTotal: 3450,
        customer: { ...p.customer, city: "Lahore" },
      }),
    );
    assert.equal(wrongCity.status, 409);
    process.env.ORDERS_ENABLED = "false";
    assert.equal(
      (await POST(request({ ...p, key: crypto.randomUUID() }))).status,
      503,
    );
  } finally {
    for (const k of [
      "SHEETS_GATEWAY_URL",
      "SHEETS_GATEWAY_SECRET",
      "PUBLIC_ORIGIN",
      "ORDERS_ENABLED",
    ]) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
    await new Promise<void>((r) => server.close(() => r()));
  }
});
