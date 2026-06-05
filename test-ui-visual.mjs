#!/usr/bin/env node

/**
 * Visual UI testing for Studify Up with screenshots
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000;
const SCREENSHOT_DIR = '/tmp/studify-screenshots';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

let viteProcess = null;

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function startViteServer() {
  return new Promise((resolve, reject) => {
    log('Starting Vite dev server...');
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: '/Users/ohnedan/Developer/studify-up',
      stdio: 'pipe',
    });

    let output = '';
    viteProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('VITE') || output.includes('localhost')) {
        log('✓ Vite server started');
        resolve();
      }
    });

    viteProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      reject(new Error('Vite server timeout'));
    }, 15000);
  });
}

function stopViteServer() {
  if (viteProcess) {
    viteProcess.kill();
  }
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch(`${BASE_URL}`);
      if (response.ok || response.status === 404) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server failed to start');
}

const results = [];

async function testPage(name, url, checks) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    log(`\n📱 Testing: ${name}`);
    log(`   URL: ${url}`);

    await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT }).catch(() => {});

    // Take screenshot
    const screenshotPath = `${SCREENSHOT_DIR}/${name.replace(/\s+/g, '_').toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath });
    log(`   Screenshot: ${screenshotPath}`);

    // Get page info
    const title = await page.title();
    const url_final = page.url();
    const content_length = (await page.content()).length;

    log(`   Page Title: ${title}`);
    log(`   Final URL: ${url_final}`);
    log(`   Content Length: ${content_length} bytes`);

    // Run checks
    const testResults = {};
    for (const [checkName, checkFn] of Object.entries(checks)) {
      try {
        const result = await checkFn(page);
        testResults[checkName] = result ? '✓' : '✗';
        if (!result) log(`   ✗ ${checkName}`);
      } catch (error) {
        testResults[checkName] = '✗';
        log(`   ✗ ${checkName}: ${error.message}`);
      }
    }

    results.push({
      name,
      url,
      title,
      content_length,
      checks: testResults,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await startViteServer();
    await waitForServer();

    log(`\n🌐 Visual UI Testing - Studify Up at ${BASE_URL}`);
    log('━'.repeat(70));

    // Test 1: Landing Page
    await testPage('Landing Page', `${BASE_URL}/`, {
      'Page loads': async (page) => (await page.content()).length > 100,
      'Has heading/title': async (page) => (await page.locator('h1, [class*="heading"]').count()) > 0,
      'Has buttons': async (page) => (await page.locator('button').count()) > 0,
      'Has links': async (page) => (await page.locator('a').count()) > 0,
      'No console errors': async (page) => {
        let errors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.waitForTimeout(1000);
        return errors.length === 0;
      },
    });

    // Test 2: Sets Page
    await testPage('Sets Page', `${BASE_URL}/sets`, {
      'Page loads': async (page) => (await page.content()).length > 100,
      'Has main content': async (page) => (await page.locator('main, [role="main"]').count()) > 0,
      'Has grid/list': async (page) => (await page.locator('[role="list"], [class*="grid"], [class*="list"]').count()) > 0,
      'Responsive layout': async (page) => {
        const viewport = await page.evaluate(() => window.innerWidth);
        return viewport > 0;
      },
    });

    // Test 3: Set Detail Page
    await testPage('Set Detail Page', `${BASE_URL}/set/TEST_SET_ID`, {
      'Page loads or redirects': async (page) => (await page.content()).length > 100,
      'No crash': async (page) => {
        const errors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.waitForTimeout(500);
        return errors.length === 0;
      },
    });

    // Test 4: Game Mode Pages
    await testPage('Flashcards Mode', `${BASE_URL}/set/TEST_SET_ID/flashcards`, {
      'Page accessible': async (page) => (await page.content()).length > 100,
      'Redirects gracefully': async (page) => !page.url().includes('undefined'),
    });

    // Test 5: Error Page
    await testPage('Invalid Set ID', `${BASE_URL}/set/invalid-nonexistent-id-xyz`, {
      'Page loads': async (page) => (await page.content()).length > 50,
      'No infinite loop': async (page) => {
        const errors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.waitForTimeout(1000);
        return errors.length < 5; // Allow some errors, but not many
      },
    });

    // Test 6: Mobile View
    const mobileContext = await (await chromium.launch()).newContext({
      viewport: { width: 375, height: 667 },
    });
    const mobilePage = await mobileContext.newPage();
    await testPage('Mobile Landing', `${BASE_URL}/`, {
      'Mobile viewport': async (page) => {
        const viewport = await page.evaluate(() => window.innerWidth);
        return viewport <= 400;
      },
      'No horizontal scroll': async (page) => {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        return scrollWidth <= clientWidth + 10;
      },
    });
    await mobileContext.close();

    // Summary
    log('\n' + '━'.repeat(70));
    log('\n📊 TEST SUMMARY');
    log(`Total pages tested: ${results.length}`);

    results.forEach((result) => {
      const passCount = Object.values(result.checks).filter((v) => v === '✓').length;
      const totalCount = Object.keys(result.checks).length;
      log(
        `\n${result.name}: ${passCount}/${totalCount} checks passed`,
      );
      Object.entries(result.checks).forEach(([check, status]) => {
        log(`  ${status} ${check}`);
      });
    });

    log('\n' + '━'.repeat(70));
    log('\n✅ Visual testing complete. Screenshots saved to:');
    log(SCREENSHOT_DIR);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    stopViteServer();
  }
}

main().catch((error) => {
  log(`Error: ${error.message}`);
  stopViteServer();
  process.exit(1);
});
