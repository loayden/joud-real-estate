import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

async function consoleErrors(page: any) {
  const errors: string[] = [];
  page.on("pageerror", (e: any) =>
    errors.push("pageerror: " + String(e?.message || e).slice(0, 200)),
  );
  page.on("console", (msg: any) => {
    if (msg.type() === "error")
      errors.push("console.error: " + msg.text().slice(0, 200));
  });
  return errors;
}

for (const locale of ["ar", "en"] as const) {
  test(`guest home loads, RTL/LTR correct, no console errors [${locale}]`, async ({
    page,
  }) => {
    const errors = await consoleErrors(page);
    await page.goto(`${BASE}/${locale}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15000 });
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe(locale === "ar" ? "rtl" : "ltr");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe(locale);
    expect(errors, JSON.stringify(errors)).toEqual([]);
  });

  test(`guest search + filters + sort + pagination [${locale}]`, async ({
    page,
  }) => {
    const errors = await consoleErrors(page);
    await page.goto(`${BASE}/${locale}/search`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("form").first()).toBeVisible({ timeout: 15000 });
    // filter sidebar present (desktop) or filter button (mobile)
    const filterVisible = await page
      .locator("text=/الفلاتر|Filter/")
      .filter({ visible: true })
      .count();
    expect(filterVisible).toBeGreaterThan(0);
    // sort control (select, combobox, or sort button)
    const sortCount = await page.locator('select, [role="combobox"]').count();
    const sortBtn = await page
      .getByRole("button", { name: /الأحدث|Newest|الأرخص|Price|ترتيب|Sort/ })
      .count();
    expect(sortCount + sortBtn).toBeGreaterThan(0);
    expect(errors, JSON.stringify(errors)).toEqual([]);
  });

  test(`guest listing detail + gallery + contact [${locale}]`, async ({
    page,
  }) => {
    const errors = await consoleErrors(page);
    await page.goto(`${BASE}/${locale}/property/demo-sale-1`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    // gallery images
    const imgs = await page.locator("img").count();
    expect(imgs).toBeGreaterThan(0);
    // contact buttons (whatsapp / call / inquiry form)
    const contact = await page
      .locator("text=/واتساب|WhatsApp|اتصل|Call|استفسار|Inquir|تواصل|Contact/")
      .count();
    expect(contact).toBeGreaterThan(0);
    expect(errors, JSON.stringify(errors)).toEqual([]);
  });

  test(`guest language switch [${locale}]`, async ({ page }) => {
    await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
    const switcher = page.locator('[aria-label="Language selector"]').first();
    if (await switcher.isVisible()) {
      const target = locale === "ar" ? "EN" : "AR";
      await switcher
        .getByRole("button", { name: target, exact: true })
        .first()
        .click();
      await expect(page).toHaveURL(locale === "ar" ? /\/en/ : /\/ar/, {
        timeout: 15000,
      });
    }
  });

  test(`guest static pages + footer [${locale}]`, async ({ page }) => {
    for (const slug of [
      "/about",
      "/contact",
      "/mortgage",
      "/compounds",
      "/developers",
      "/agents",
    ]) {
      await page.goto(`${BASE}/${locale}${slug}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page).not.toHaveTitle(/404/);
    }
    await expect(page.locator("footer").first()).toBeVisible();
  });
}

for (const viewport of [
  { w: 360, h: 800 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
]) {
  test(`viewport ${viewport.w}x${viewport.h}: home has no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.w, height: viewport.h });
    await page.goto(`${BASE}/ar`, { waitUntil: "networkidle" });
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
