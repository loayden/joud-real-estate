import { test, expect } from "@playwright/test";

const LOCALES = ["ar", "en"];

for (const locale of LOCALES) {
  test.describe(`Homepage - ${locale}`, () => {
    test(`loads successfully`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page).toHaveTitle(/جود العقارية|Joud Real Estate/);
    });

    test(`shows hero section`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("section").first()).toBeVisible();
    });

    test(`navigation works`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("nav").first()).toBeVisible();
    });
  });

  test.describe(`Properties listing - ${locale}`, () => {
    test(`loads successfully`, async ({ page }) => {
      await page.goto(`/${locale}/properties`);
      await expect(page).toHaveTitle(/العقارات|Properties/);
    });

    test(`shows property cards`, async ({ page }) => {
      await page.goto(`/${locale}/properties`);
      // Property cards are article elements with class containing "overflow-hidden"
      await expect(page.locator("article.overflow-hidden").first()).toBeVisible(
        { timeout: 10000 },
      );
    });
  });

  test.describe(`Search page - ${locale}`, () => {
    test(`loads without 404`, async ({ page }) => {
      await page.goto(`/${locale}/search`);
      await expect(page).not.toHaveTitle(/404/);
    });

    test(`shows search form`, async ({ page }) => {
      await page.goto(`/${locale}/search`);
      await expect(page.locator("form").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test(`filters are present`, async ({ page }) => {
      await page.goto(`/${locale}/search`);
      // Check for filter button (mobile) or filter heading (desktop) - find visible one
      // Use locale-specific text
      const filterText = locale === "ar" ? "الفلاتر" : "Filter";
      await expect(
        page.locator(`text=${filterText}`).filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe(`Property detail - ${locale}`, () => {
    test(`loads a demo property`, async ({ page }) => {
      await page.goto(`/${locale}/property/demo-sale-1`);
      await expect(page).not.toHaveTitle(/404/);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe(`Auth pages - ${locale}`, () => {
    test(`login page loads`, async ({ page }) => {
      await page.goto(`/${locale}/login`);
      await expect(page).not.toHaveTitle(/404/);
      await expect(page.locator("form").first()).toBeVisible();
    });

    test(`register page loads`, async ({ page }) => {
      await page.goto(`/${locale}/register`);
      await expect(page).not.toHaveTitle(/404/);
      await expect(page.locator("form").first()).toBeVisible();
    });
  });

  test.describe(`Dashboard (protected) - ${locale}`, () => {
    test(`redirects to login when not authenticated`, async ({ page }) => {
      await page.goto(`/${locale}/dashboard`);
      await expect(page.url()).toContain("/login");
    });
  });
}

test.describe("Language switching", () => {
  test("switches locale correctly", async ({ page }) => {
    await page.goto("/ar");
    await expect(page).toHaveURL(/\/ar/);

    const langSwitcher = page
      .locator('[aria-label="Language selector"]')
      .first();
    if (await langSwitcher.isVisible()) {
      await langSwitcher.locator("button").nth(1).click();
      await expect(page).toHaveURL(/\/en/);
    }
  });
});
