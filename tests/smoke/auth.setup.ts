import { test as setup, expect } from "@playwright/test";
import path from "path";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const QA_EMAIL = process.env.QA_USER_EMAIL || "qa-user@joud.test";
const QA_PASS = process.env.QA_USER_PASS || "QaUser@2024!";
const ADMIN_EMAIL = "admin@joud.sa";
const ADMIN_PASS = "JoudAdmin@2024!";
const QA_STATE = path.join(__dirname, ".auth", "qa.json");
const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

/**
 * Runs before every spec (see dependencies in playwright.config.ts).
 * Creates fresh authenticated storage states so specs never depend on
 * stale committed cookies or on execution order.
 */
setup("authenticate qa user and admin", async ({ request }) => {
  for (const [email, password, file] of [
    [QA_EMAIL, QA_PASS, QA_STATE],
    [ADMIN_EMAIL, ADMIN_PASS, ADMIN_STATE],
  ] as const) {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email, password },
    });
    expect(res.status()).toBe(200);
    await request.storageState({ path: file });
  }
});
