import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("catalog, search, bag persistence, quantity, preview checkout and keyboard", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", {
      name: "Add The everyday tray to bag",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search pieces" }).fill("not found");
  await expect(
    page.getByRole("heading", { name: "No pieces found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page
    .getByRole("button", { name: "Add The everyday tray to bag", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Open bag, 1 items" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Increase The everyday tray" })
    .click();
  await expect(page.getByText("Rs 6,400", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page
    .getByLabel("Delivery area", { exact: true })
    .selectOption("karachi");
  await expect(
    page.getByRole("button", { name: "Orders opening soon" }),
  ).toBeDisabled();
  await expect(page.getByText("Rs 6,650", { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `preview-${info.project.name}.png`,
    fullPage: true,
  });
});
test("live-mode UI validates and shows receipt with WhatsApp", async ({
  page,
}) => {
  await page.route("**/api/catalog", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({
      json: {
        ...data,
        demo: false,
        ordersOpen: true,
        whatsapp: "923001234567",
      },
    });
  });
  let submitted: any;
  await page.route("**/api/orders", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        id: "LH-TEST1234",
        total: 3450,
        delivery: 250,
        whatsapp: "https://wa.me/923001234567?text=Order%20LH-TEST1234",
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add The everyday tray to bag", exact: true })
    .click();
  await page.getByRole("button", { name: "Open bag, 1 items" }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page
    .getByRole("button", { name: "Place cash on delivery order" })
    .click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Test Buyer");
  await page.getByLabel("Mobile / WhatsApp number").fill("03001234567");
  await page.getByLabel("House, street and area").fill("House 1, Test Street");
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page
    .getByLabel("Delivery area", { exact: true })
    .selectOption("karachi");
  await page
    .getByRole("button", { name: "Place cash on delivery order" })
    .click();
  await expect(page.getByText("LH-TEST1234", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue on WhatsApp" }),
  ).toHaveAttribute("href", /wa.me/);
  expect(submitted.items).toEqual([{ id: "tray", quantity: 1 }]);
  expect(submitted.total).toBeUndefined();
});
test("network failures provide retry and keep bag", async ({ page }) => {
  await page.route("**/api/catalog", (r) =>
    r.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await expect(
    page.getByText("The collection could not load. Please try again."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("price changes refresh totals and preserve delivery fields for retry", async ({
  page,
}) => {
  const originalCatalog = await (await page.request.get("/api/catalog")).json();
  let price = 3200,
    attempt = 0;
  await page.route("**/api/catalog", async (route) => {
    const c = structuredClone(originalCatalog);
    c.products[0].price = price;
    await route.fulfill({
      json: { ...c, demo: false, ordersOpen: true, whatsapp: "923001234567" },
    });
  });
  await page.route("**/api/orders", async (route) => {
    attempt++;
    const payload = route.request().postDataJSON();
    if (attempt === 1) {
      price = 3500;
      await route.fulfill({
        status: 409,
        json: {
          error: "Prices changed. Review your updated bag before ordering.",
        },
      });
    } else {
      expect(payload.expectedTotal).toBe(3750);
      await route.fulfill({
        status: 201,
        json: { id: "LH-UPDATED", total: 3750, whatsapp: null },
      });
    }
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Add The everyday tray to bag", exact: true })
    .click();
  await page.getByRole("button", { name: "Open bag, 1 items" }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Test Buyer");
  await page.getByLabel("Mobile / WhatsApp number").fill("03001234567");
  await page.getByLabel("House, street and area").fill("House 1, Test Street");
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page
    .getByLabel("Delivery area", { exact: true })
    .selectOption("karachi");
  await page
    .getByRole("button", { name: "Place cash on delivery order" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Prices changed" }),
  ).toBeVisible();
  await expect(page.getByText("Rs 3,750", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Test Buyer",
  );
  await page
    .getByRole("button", { name: "Place cash on delivery order" })
    .click();
  await expect(page.getByText("LH-UPDATED", { exact: true })).toBeVisible();
});
