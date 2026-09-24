// Generates Playwright storage states for qa-user + admin.
// Run: node tests/launch/gen-auth-state.mjs  (dev server must be up)
// 2 logins total — well under the 5/min/IP auth rate limit.
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, '.auth');
const { mkdirSync } = await import('fs');
mkdirSync(outDir, { recursive: true });

async function loginAs(email, password, outFile) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/ar/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/dashboard|my-listings|profile|admin/, { timeout: 20000 });
  await page.context().storageState({ path: path.join(outDir, outFile) });
  console.log(`saved ${outFile} for ${email}`);
  await browser.close();
}

await loginAs(process.env.QA_USER_EMAIL || 'qa-user@joud.test', process.env.QA_USER_PASS || 'QaUser@2024!', 'qa.json');
await new Promise((r) => setTimeout(r, 5000));
await loginAs('admin@joud.sa', 'JoudAdmin@2024!', 'admin.json');
console.log('done');
