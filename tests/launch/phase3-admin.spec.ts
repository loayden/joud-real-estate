import { test, expect } from "@playwright/test";
import path from "path";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = "admin@joud.sa";
const ADMIN_PASS = "JoudAdmin@2024!";
const QA_EMAIL = process.env.QA_USER_EMAIL || "qa-user@joud.test";
const QA_PASS = process.env.QA_USER_PASS || "QaUser@2024!";
const QA_STATE = path.join(__dirname, ".auth", "qa.json");
const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

const IDS = {
  categoryId: "cmq68100a001dareqt8o59m0n",
  typeId: "cmq68100c001fareqh2s5rsn8",
  regionId: "cmtke6vv70000p6iaebnwxykj",
  cityId: "cmtke6vwe000lp6iaw12rxmxj",
};

async function csrfHeaders(page: any) {
  const res = await page.request.get(`${BASE}/api/csrf`);
  const body = await res.json();
  return {
    "x-csrf-token": body.data.token,
    "Content-Type": "application/json",
  };
}

async function apiLogin(page: any, email: string, password: string) {
  const res = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email, password },
  });
  expect(res.status()).toBe(200);
}

test.describe("Phase 3 - admin UI", () => {
  test("admin login via UI, dashboard + sub-pages render", async ({ page }) => {
    test.setTimeout(180000);
    await page.goto(`${BASE}/ar/login`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/dashboard|admin/, { timeout: 15000 });
    for (const slug of [
      "/ar/admin/dashboard",
      "/ar/admin/properties",
      "/ar/admin/users",
      "/ar/admin/reports",
      "/ar/admin/ratings",
      "/ar/admin/regions",
      "/ar/admin/categories",
      "/ar/admin/analytics",
    ]) {
      await page.goto(`${BASE}${slug}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 20000,
      });
      await expect(page).not.toHaveURL(/login/);
    }
  });
});

test.describe("Phase 3 - moderation lifecycle (API)", () => {
  test("submit → approve goes live; submit → reject stays hidden", async ({
    page,
    browser,
  }) => {
    const qaCtx = await browser.newContext({ storageState: QA_STATE });
    const qreq = qaCtx.request;
    const csrfRes = await qreq.get(`${BASE}/api/csrf`);
    const csrfBody = await csrfRes.json();
    const headers = {
      "x-csrf-token": csrfBody.data.token,
      "Content-Type": "application/json",
    };
    const mk = (t: string) => ({
      titleAr: t,
      descriptionAr: "وصف كافٍ يتجاوز الحد الأدنى المطلوب للتحقق من الصحة هنا.",
      listingType: "SALE",
      ...IDS,
      price: 2000000,
      area: 130,
      action: "submit",
    });
    const ts = Date.now();
    const c1 = await qreq.post(`${BASE}/api/properties`, {
      headers,
      data: mk(`عقار قبول ${ts}`),
    });
    expect(c1.status()).toBe(201);
    const j1 = await c1.json();
    const c2 = await qreq.post(`${BASE}/api/properties`, {
      headers,
      data: mk(`عقار رفض ${ts}`),
    });
    expect(c2.status()).toBe(201);
    const j2 = await c2.json();
    await qaCtx.close();

    // switch to admin (stored session, no fresh login)
    const adminCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const areq = adminCtx.request;
    const acsrf = await (await areq.get(`${BASE}/api/csrf`)).json();
    const aheaders = {
      "x-csrf-token": acsrf.data.token,
      "Content-Type": "application/json",
    };

    const approve = await areq.put(
      `${BASE}/api/admin/properties/${j1.data.id}/approve`,
      { headers: aheaders, data: {} },
    );
    expect([200, 201]).toContain(approve.status());
    const reject = await areq.put(
      `${BASE}/api/admin/properties/${j2.data.id}/reject`,
      {
        headers: aheaders,
        data: { reason: "اختبار آلي: بيانات غير مكتملة" },
      },
    );
    expect([200, 201]).toContain(reject.status());

    // approved visible in public search; rejected not
    const s1 = await areq.get(
      `${BASE}/api/properties/search?q=${encodeURIComponent("قبول " + ts)}`,
    );
    expect(s1.status()).toBe(200);
    const b1 = await s1.json();
    expect(b1.data.total).toBe(1);
    expect((b1.data.data || []).map((p: any) => p.slug)).toContain(
      j1.data.slug,
    );
    const s2 = await areq.get(
      `${BASE}/api/properties/search?q=${encodeURIComponent("رفض " + ts)}`,
    );
    expect(s2.status()).toBe(200);
    expect((await s2.json()).data.total).toBe(0);
    // cleanup via admin delete
    expect(
      (
        await areq.delete(`${BASE}/api/admin/properties/${j1.data.id}`, {
          headers: aheaders,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await areq.delete(`${BASE}/api/admin/properties/${j2.data.id}`, {
          headers: aheaders,
        })
      ).status(),
    ).toBe(200);
    await adminCtx.close();
  });
});

test.describe("Phase 3 - permissions + IDOR (API + pages)", () => {
  test("normal user blocked from admin; IDOR on other-user listing; mine scoped", async ({
    page,
    browser,
  }) => {
    const qaCtx = await browser.newContext({ storageState: QA_STATE });
    const qreq = qaCtx.request;
    const csrfBody = await (await qreq.get(`${BASE}/api/csrf`)).json();
    const headers = {
      "x-csrf-token": csrfBody.data.token,
      "Content-Type": "application/json",
    };
    // pages redirect to login (fresh guest page)
    await page.goto(`${BASE}/ar/admin`, { waitUntil: "domcontentloaded" });
    await expect(page.url()).toContain("/login");
    await page.goto(`${BASE}/ar/admin/users`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.url()).toContain("/login");
    // direct API calls → 401/403
    for (const url of [
      `${BASE}/api/admin/properties`,
      `${BASE}/api/admin/users`,
      `${BASE}/api/admin/reports`,
      `${BASE}/api/admin/stats`,
    ]) {
      const res = await qreq.get(url, { headers });
      expect([401, 403]).toContain(res.status());
    }
    // IDOR: qa-user tries to edit/delete admin's demo listing
    const putOther = await qreq.put(
      `${BASE}/api/properties/cmtkelcea009csa9xpfhnyykb`,
      {
        headers,
        data: { titleAr: "محاولة تعديل غير مصرح بها" },
      },
    );
    expect([401, 403, 404]).toContain(putOther.status());
    const delOther = await qreq.delete(
      `${BASE}/api/properties/cmtkelcea009csa9xpfhnyykb`,
      {
        headers,
      },
    );
    expect([401, 403, 404]).toContain(delOther.status());
    // mine returns 200 (ownership enforced server-side)
    const mine = await qreq.get(`${BASE}/api/properties/mine`);
    expect(mine.status()).toBe(200);
    await qaCtx.close();
  });
});
