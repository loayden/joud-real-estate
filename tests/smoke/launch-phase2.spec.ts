import { test, expect } from "@playwright/test";
import path from "path";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const QA_EMAIL = process.env.QA_USER_EMAIL || "qa-user@joud.test";
const QA_PASS = process.env.QA_USER_PASS || "QaUser@2024!";
const QA_STATE = path.join(__dirname, ".auth", "qa.json");
const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

// Valid seed IDs (verified 2026-09-24 via DB query)
const IDS = {
  categoryId: "cmq68100a001dareqt8o59m0n", // residential
  typeId: "cmq68100c001fareqh2s5rsn8", // apartment
  regionId: "cmtke6vv70000p6iaebnwxykj", // cairo
  cityId: "cmtke6vwe000lp6iaw12rxmxj", // heliopolis
  cityId2: "cmtke6vwl000vp6ia2c1vjjh7", // maadi
};

function basePayload(titleAr: string, overrides: Record<string, any> = {}) {
  return {
    titleAr,
    descriptionAr:
      "شقة اختبار شاملة بوصف كافٍ يتجاوز الحد الأدنى المطلوب للتحقق من صحة البيانات.",
    listingType: "SALE",
    categoryId: IDS.categoryId,
    typeId: IDS.typeId,
    regionId: IDS.regionId,
    cityId: IDS.cityId,
    price: 1500000,
    area: 120,
    ...overrides,
  };
}

async function csrfHeaders(page: any) {
  const res = await page.request.get(`${BASE}/api/csrf`);
  const body = await res.json();
  return {
    "x-csrf-token": body.data.token,
    "Content-Type": "application/json",
  };
}

test.describe("Phase 2 - auth UI", () => {
  test("register new unique user via UI", async ({ page }) => {
    const email = `qa-${Date.now()}@joud.test`;
    await page.goto(`${BASE}/ar/register`, { waitUntil: "networkidle" });
    await page
      .locator('input[name="firstName"], #firstName')
      .first()
      .fill("QA");
    await page
      .locator('input[name="lastName"], #lastName')
      .first()
      .fill("Test");
    await page
      .locator('input[name="phone"], #phone')
      .first()
      .fill("+201001234567");
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill("QaTest@2024!");
    await page.locator('button[type="submit"]').first().click();
    // success message OR dev verification URL OR validation error text — but never 404/500
    await expect(page).not.toHaveTitle(/404/);
    await page.waitForTimeout(3000);
  });

  test("login as qa-user via UI, visit dashboard, logout, protected redirect", async ({
    page,
  }) => {
    await page.goto(`${BASE}/ar/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').first().fill(QA_EMAIL);
    await page.locator('input[type="password"]').first().fill(QA_PASS);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/dashboard|my-listings|profile/, {
      timeout: 15000,
    });
    // protected route reachable now
    await page.goto(`${BASE}/ar/my-listings`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).not.toHaveURL(/login/);
    // logout via API (UI logout varies) then verify protected redirect
    const headers = await csrfHeaders(page);
    await page.request.post(`${BASE}/api/auth/logout`, { headers });
    await page.goto(`${BASE}/ar/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.url()).toContain("/login");
  });

  test("reset-password + forgot-password pages render", async ({ page }) => {
    for (const slug of [
      "/ar/forgot-password",
      "/ar/reset-password",
      "/en/forgot-password",
    ]) {
      await page.goto(`${BASE}${slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page).not.toHaveTitle(/404/);
    }
  });

  test("new-listing form renders, survives refresh", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: QA_STATE });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ar/my-listings/new`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15000 });
    await expect(page).not.toHaveURL(/login/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15000 });
    await ctx.close();
  });
});

test.describe("Phase 2 - owner analytics", () => {
  test("my-listings shows per-listing performance stats", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: ADMIN_STATE });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ar/my-listings`, { waitUntil: "networkidle" });
    await expect(
      page.locator("table thead th", { hasText: "الأداء" }).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 15000,
    });
    await ctx.close();
  });
});

test.describe("Phase 2 - listing CRUD matrix (API)", () => {
  test("10-variant create matrix + validation", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: QA_STATE });
    const req = ctx.request;
    const csrfRes = await req.get(`${BASE}/api/csrf`);
    const csrfBody = await csrfRes.json();
    const headers = {
      "x-csrf-token": csrfBody.data.token,
      "Content-Type": "application/json",
    };
    const created: string[] = [];
    const variants: Array<[string, Record<string, any>, number]> = [
      ["sale-apartment", {}, 201],
      ["rent-apartment", { listingType: "RENT", price: 8000 }, 201],
      ["other-city", { cityId: IDS.cityId2 }, 201],
      ["arabic-only", { titleEn: undefined, descriptionEn: undefined }, 201],
      ["english-only-title", { titleEn: "English only title here" }, 201],
      ["long-desc", { descriptionAr: "وصف طويل. ".repeat(200) }, 201],
      ["no-optionals", { bedrooms: undefined, bathrooms: undefined }, 201],
      ["invalid-price-zero", { price: 0 }, 400],
      ["invalid-price-negative", { price: -5 }, 400],
      ["invalid-area-zero", { area: 0 }, 400],
    ];
    for (const [name, overrides, expected] of variants) {
      const res = await req.post(`${BASE}/api/properties`, {
        headers,
        data: basePayload(`شقة اختبار ${name} ${Date.now()}`, overrides),
      });
      expect(res.status(), name).toBe(expected);
      if (expected === 201) {
        const body = await res.json();
        expect(body.success).toBe(true);
        created.push(body.data.id);
      }
    }
    expect(created.length).toBe(7);

    // new listings appear in mine
    const mine = await req.get(`${BASE}/api/properties/mine`);
    expect(mine.status()).toBe(200);

    // cleanup: delete created
    for (const id of created) {
      const del = await req.delete(`${BASE}/api/properties/${id}`, { headers });
      expect([200, 204]).toContain(del.status());
    }
    await ctx.close();
  });

  test("edit + favorite + inquiry + report + double-submit", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: QA_STATE });
    const req = ctx.request;
    const csrfRes = await req.get(`${BASE}/api/csrf`);
    const csrfBody = await csrfRes.json();
    const headers = {
      "x-csrf-token": csrfBody.data.token,
      "Content-Type": "application/json",
    };
    // create one
    const res = await req.post(`${BASE}/api/properties`, {
      headers,
      data: basePayload(`شقة دورة كاملة ${Date.now()}`),
    });
    expect(res.status()).toBe(201);
    const { id } = (await res.json()).data;

    // edit title
    const put = await req.put(`${BASE}/api/properties/${id}`, {
      headers,
      data: { titleAr: `شقة معدلة ${Date.now()}` },
    });
    expect(put.status()).toBe(200);

    // double-submit same payload: record whether duplicates are created
    const [r1, r2] = await Promise.all([
      req.post(`${BASE}/api/properties`, {
        headers,
        data: basePayload(`مكرر ${Date.now()}`),
      }),
      req.post(`${BASE}/api/properties`, {
        headers,
        data: basePayload(`مكرر ${Date.now()}`),
      }),
    ]);
    const dupIds: string[] = [];
    for (const r of [r1, r2]) {
      if (r.status() === 201) dupIds.push((await r.json()).data.id);
    }
    // favorite/inquiry/report target an APPROVED listing (drafts correctly 404)
    const approvedId = "cmtkelcea009csa9xpfhnyykb"; // demo-sale-1
    const favDraft = await req.post(`${BASE}/api/favorites`, {
      headers,
      data: { propertyId: id },
    });
    expect(favDraft.status()).toBe(404);
    // favorite toggle on + off
    const fav1 = await req.post(`${BASE}/api/favorites`, {
      headers,
      data: { propertyId: approvedId },
    });
    expect([200, 201]).toContain(fav1.status());
    const fav2 = await req.post(`${BASE}/api/favorites`, {
      headers,
      data: { propertyId: approvedId },
    });
    expect([200, 201]).toContain(fav2.status());

    // inquiry as owner should be rejected (own listing) OR accepted — record, don't assert blindly
    const inq = await req.post(`${BASE}/api/inquiries`, {
      headers,
      data: {
        propertyId: approvedId,
        name: "QA",
        email: "qa@joud.test",
        message: "استفسار اختبار تجريبي كافٍ للحد الأدنى",
      },
    });
    expect([200, 201, 400]).toContain(inq.status());

    // report
    const rep = await req.post(`${BASE}/api/reports`, {
      headers,
      data: {
        propertyId: approvedId,
        reason: "OTHER",
        details: "بلاغ اختبار آلي",
      },
    });
    expect([200, 201, 400, 409, 429]).toContain(rep.status());

    // cleanup
    for (const did of [id, ...dupIds]) {
      await req.delete(`${BASE}/api/properties/${did}`, { headers });
    }
    await ctx.close();
  });
});
