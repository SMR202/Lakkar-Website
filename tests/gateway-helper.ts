import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
export function harness() {
  const tables: Record<string, unknown[][]> = {
    Products: [
      [
        "id",
        "name",
        "category",
        "price",
        "stock",
        "image",
        "description",
        "dimensions",
        "care",
        "active",
      ],
      [
        "tray",
        "Tray",
        "Serveware",
        3200,
        2,
        "https://example.com/a.jpg",
        "A tray",
        "35cm",
        "Wipe",
        true,
      ],
    ],
    Delivery: [
      ["id", "name", "fee", "city"],
      ["karachi", "Karachi", 250, "Karachi"],
    ],
    Settings: [
      ["key", "value"],
      ["ordersEnabled", "true"],
      ["ownerEmail", "test@example.com"],
      ["whatsapp", "923001234567"],
      ["currency", "PKR"],
      ["delivery", "Delivery policy for testing."],
      ["returns", "Returns policy for testing."],
      ["privacy", "Privacy policy for testing."],
    ],
    Orders: [
      [
        "record",
        "orderId",
        "created",
        "name",
        "phone",
        "city",
        "total",
        "status",
        "emailStatus",
      ],
    ],
  };
  const sent: unknown[] = [];
  const cache = new Map();
  let locked = false,
    failMail = false;
  const sheet = (n: string) => ({
    getDataRange: () => ({ getValues: () => tables[n].map((r) => [...r]) }),
    appendRow: (r: unknown[]) => tables[n].push(r),
    getRange: (r: number, c: number) => ({
      setValue: (v: unknown) => {
        tables[n][r - 1][c - 1] = v;
      },
    }),
  });
  const ctx = vm.createContext({
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: sheet }),
      flush: () => {},
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) =>
          k === "GATEWAY_SECRET" ? "secret" : "sheet",
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          assert.equal(locked, false);
          locked = true;
        },
        tryLock: () => {
          locked = true;
          return true;
        },
        releaseLock: () => {
          locked = false;
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cache.get(k),
        put: (k: string, v: string) => cache.set(k, v),
      }),
    },
    Utilities: { getUuid: () => crypto.randomUUID() },
    MailApp: {
      sendEmail: (v: unknown) => {
        if (failMail) throw Error("quota");
        sent.push(v);
      },
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (s: string) => ({ setMimeType: () => s }),
    },
    console,
  });
  vm.runInContext(fs.readFileSync("google-apps-script/Code.gs", "utf8"), ctx);
  return {
    ctx,
    tables,
    sent,
    fail: () => {
      failMail = true;
    },
    recover: () => {
      failMail = false;
    },
    call: (action: string, payload: unknown, secret = "secret") =>
      JSON.parse(
        ctx.doPost({
          postData: { contents: JSON.stringify({ secret, action, payload }) },
        }),
      ),
  };
}
