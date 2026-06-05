#!/usr/bin/env node

import { chromium } from 'playwright';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp/studify-ui-tests';

let viteProcess = null;

function startViteServer() {
  return new Promise((resolve) => {
    console.log('Starting Vite server...');
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: '/Users/ohnedan/Developer/studify-up',
      stdio: 'pipe',
    });

    let resolved = false;
    viteProcess.stdout.on('data', (data) => {
      if (!resolved && (data.toString().includes('VITE') || data.toString().includes('localhost'))) {
        resolved = true;
        resolve();
      }
    });

    setTimeout(() => {
      if (!resolved) resolve();
    }, 15000);
  });
}

function stopViteServer() {
  if (viteProcess) viteProcess.kill();
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${BASE_URL}`);
      if (response.ok || response.status === 404) return true;
    } catch (e) {
      // Not ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server failed to start');
}

async function main() {
  try {
    const fs = await import('fs');
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    await startViteServer();
    await waitForServer();

    const browser = await chromium.launch({ headless: true });

    console.log('Taking screenshots...');

    // 1. Landing page
    let page = await browser.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-landing-page.png` });
    console.log('✓ Landing page screenshot');
    await page.close();

    // 2. Home page (sets list)
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-home-page.png` });
    console.log('✓ Home page screenshot');
    await page.close();

    // 3. Set detail page
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/set/starter_pack_en_ua`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-set-detail.png`, fullPage: true });
    console.log('✓ Set detail page screenshot');

    // Scroll and take more screenshots
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03b-set-detail-scroll.png`, fullPage: true });
    console.log('✓ Set detail page (scrolled) screenshot');
    await page.close();

    // 4. Flashcards mode
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/set/starter_pack_en_ua/flashcards`, { waitUntil: 'load', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-flashcards-mode.png`, fullPage: true });
    console.log('✓ Flashcards mode screenshot');
    await page.close();

    // 5. Learn mode
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/set/starter_pack_en_ua/learn`, { waitUntil: 'load', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-learn-mode.png`, fullPage: true });
    console.log('✓ Learn mode screenshot');
    await page.close();

    // 6. Mobile view of landing
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    page = await mobileContext.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-mobile-landing.png`, fullPage: true });
    console.log('✓ Mobile landing page screenshot');
    await page.close();

    // 7. Mobile view of set detail
    page = await mobileContext.newPage();
    await page.goto(`${BASE_URL}/set/starter_pack_en_ua`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-mobile-set-detail.png`, fullPage: true });
    console.log('✓ Mobile set detail page screenshot');
    await page.close();

    await mobileContext.close();
    await browser.close();

    console.log(`\n✅ All screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('You can view them in your system to manually verify UI');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    stopViteServer();
  }
}

main();
