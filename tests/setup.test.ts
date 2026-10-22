import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
test("owner setup binds copied sheet, generates private key once and avoids duplicate triggers", () => {
  const properties = new Map<string, string>();
  let currentSheet = "client-sheet";
  const triggers: { getHandlerFunction: () => string }[] = [];
  const ctx = vm.createContext({
    SpreadsheetApp: {
      getActive: () => ({
        getId: () => currentSheet,
        getSheetByName: () => ({}),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties.get(key),
        setProperty: (key: string, value: string) => properties.set(key, value),
      }),
    },
    Utilities: { getUuid: () => crypto.randomUUID() },
    ScriptApp: {
      getProjectTriggers: () => triggers,
      newTrigger: () => ({
        timeBased: () => ({
          everyMinutes: (minutes: number) => ({
            create: () => {
              assert.equal(minutes, 5);
              triggers.push({ getHandlerFunction: () => "sendPendingEmails" });
            },
          }),
        }),
      }),
    },
  });
  vm.runInContext(fs.readFileSync("google-apps-script/Code.gs", "utf8"), ctx);
  ctx.setup();
  const secret = properties.get("GATEWAY_SECRET");
  assert.match(secret!, /^[a-f0-9]{64}$/);
  assert.equal(properties.get("SHEET_ID"), "client-sheet");
  ctx.setup();
  assert.equal(properties.get("GATEWAY_SECRET"), secret);
  assert.equal(triggers.length, 1);
  currentSheet = "copied-sheet";
  ctx.setup();
  assert.notEqual(properties.get("GATEWAY_SECRET"), secret);
  assert.equal(properties.get("SHEET_ID"), "copied-sheet");
});
