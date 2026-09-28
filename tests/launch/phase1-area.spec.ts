import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const REGION_SLUGS = [
  "new-cairo",
  "sheikh-zayed",
  "6th-october",
  "new-administrative-capital",
  "north-coast",
];
const CITY_SLUGS = ["heliopolis", "maadi", "nasr-city"];

for (const slug of [...REGION_SLUGS, ...CITY_SLUGS]) {
  test(`area page renders content for ${slug} (ar)`, async ({ page }) => {
    await page.goto(`${BASE}/ar/area/${slug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main").first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 20000 });
    const h1 = await page.locator("h1").first().textContent();
    expect(h1).not.toMatch(/غير موجودة|not found/i);
  });
}

test("area page renders content for region slug (en)", async ({ page }) => {
  await page.goto(`${BASE}/en/area/new-cairo`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 20000 });
  const h1 = await page.locator("h1").first().textContent();
  expect(h1).not.toMatch(/not found/i);
});

test("bogus area slug still shows not-found UI", async ({ page }) => {
  await page.goto(`${BASE}/ar/area/bogus-slug-xyz`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("main").first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator("body")).toContainText(/غير موجودة|not found/i, {
    timeout: 20000,
  });
});

test("citySlug alias filters search results (API)", async ({ request }) => {
  const res = await request.get(
    `${BASE}/api/properties/search?citySlug=heliopolis&limit=5`,
  );
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  for (const item of body.data.data ?? []) {
    expect(item.city?.slug ?? item.citySlug).toBe("heliopolis");
  }
});

test("regionSlug alias filters search results (API)", async ({ request }) => {
  const res = await request.get(
    `${BASE}/api/properties/search?regionSlug=new-cairo&limit=5`,
  );
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  for (const item of body.data.data ?? []) {
    expect(item.region?.slug ?? item.regionSlug).toBe("new-cairo");
  }
});

test("citySlug alias reflects in filter UI", async ({ page }) => {
  await page.goto(`${BASE}/ar/search?citySlug=heliopolis`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("main").first()).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").textContent();
  expect(body).toMatch(/مصر الجديدة|Heliopolis/);
});
