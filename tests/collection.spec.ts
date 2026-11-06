import { test, expect } from "@playwright/test";
import { sample } from "../server/sample";

test("collection rail scrolls, filters, opens products and keeps square rounded images", async ({
  page,
}, info) => {
  await page.route("**/api/catalog", (r) =>
    r.fulfill({
      json: {
        ...sample,
        products: Array.from({ length: 8 }, (_, i) => ({
          ...sample.products[0],
          id: `piece-${i}`,
          name: `Furniture piece ${i + 1}`,
          category: i === 0 ? "Seating" : "Tables",
          image: "/furniture-story-v2.webp",
        })),
      },
    }),
  );
  await page.goto("/#collection");
  const rail = page.getByRole("region", { name: "Furniture collection" });
  await expect(rail.locator("article")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "Previous pieces", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next pieces", exact: true }).click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(100);
  await rail.focus();
  await rail.press("End");
  await expect(
    page.getByRole("button", { name: "Next pieces", exact: true }),
  ).toBeDisabled();
  await rail.press("Home");
  await expect(
    page.getByRole("button", { name: "Previous pieces", exact: true }),
  ).toBeDisabled();
  const dimensions = await rail
    .locator(".product-photo")
    .first()
    .evaluate((el) => ({
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
      r: getComputedStyle(el).borderRadius,
    }));
  expect(Math.abs(dimensions.w - dimensions.h)).toBeLessThan(2);
  expect(dimensions.r).toBe("16px");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `collection-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Seating", exact: true }).click();
  await expect(rail.locator("article")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Next pieces", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "View Furniture piece 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
