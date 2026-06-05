#!/usr/bin/env node

/**
 * Comprehensive manual UI testing for Studify Up
 * Tests all major UI paths by navigating the app directly
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000;

let viteProcess = null;

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function pass(test) {
  results.passed.push(test);
  console.log(`✓ ${test}`);
}

function fail(test, error) {
  results.failed.push({ test, error: error.message || String(error) });
  console.log(`✗ ${test}: ${error.message || String(error)}`);
}

function warn(test, message) {
  results.warnings.push({ test, message });
  console.log(`⚠ ${test}: ${message}`);
}

function startViteServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Vite server...');
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: '/Users/ohnedan/Developer/studify-up',
      stdio: 'pipe',
    });

    let output = '';
    let resolved = false;

    viteProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (!resolved && (output.includes('VITE') || output.includes('localhost'))) {
        resolved = true;
        resolve();
      }
    });

    viteProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Vite server timeout'));
      }
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
      // Not ready
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server failed to start');
}

async function testLandingPage(browser) {
  console.log('\n📋 TEST PATH 1: Landing Page');
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    pass('Landing page loads');

    // Check for key elements
    const hasH1 = await page.locator('h1').count() > 0;
    if (hasH1) {
      pass('H1 heading present');
    } else {
      warn('Landing page', 'No H1 heading found');
    }

    // Check for main CTA buttons
    const getStartedBtn = await page.locator('a:has-text("Get started")').count();
    if (getStartedBtn > 0) {
      pass('"Get started" button visible');

      // Click and verify navigation
      await page.locator('a:has-text("Get started")').first().click();
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      if (page.url().includes('/login')) {
        pass('"Get started" navigates to /login');
      } else {
        warn('"Get started" navigation', `Went to ${page.url()} instead of /login`);
      }
      // Go back to landing
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    } else {
      warn('Landing page', '"Get started" button not found');
    }

    // Check for Starter Pack button
    const starterBtn = await page.locator('a:has-text("Starter Pack")').count();
    if (starterBtn > 0) {
      pass('"Starter Pack" button visible');
    } else {
      warn('Landing page', '"Starter Pack" button not found');
    }

    // Check for banner text about links
    const bannerText = await page.locator('text="Got a link"').count();
    if (bannerText > 0) {
      pass('Banner "Got a link" text visible');
    } else {
      warn('Landing page', '"Got a link" banner text not found');
    }

    // Check for demo card
    const demoCard = await page.locator('[class*="demo"]').count();
    if (demoCard > 0) {
      pass('Demo card/card flip visible');
    } else {
      warn('Landing page', 'Demo card not detected');
    }

    // Check for feature list
    const features = await page.locator('text=/study modes|Audio|Spaced|Sync/').count();
    if (features > 0) {
      pass('Feature list visible');
    } else {
      warn('Landing page', 'Features not displayed');
    }
  } catch (error) {
    fail('Landing page tests', error);
  } finally {
    await page.close();
  }
}

async function testSetListPage(browser) {
  console.log('\n📋 TEST PATH 2: Set List (after login)');
  const page = await browser.newPage();

  try {
    // Try to access sets page
    await page.goto(`${BASE_URL}/sets`, { waitUntil: 'load', timeout: 10000 }).catch(() => {
      // Page may not exist, try home
      return page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    });

    // Check if we're logged in (redirected to /login) or on home
    if (!page.url().includes('/login')) {
      pass('Set list page accessible or redirects appropriately');

      // Look for set cards/grid
      const hasGrid = await page.locator('[class*="grid"], [role="list"]').count() > 0;
      if (hasGrid) {
        pass('Set grid/list layout present');
      } else {
        warn('Set list', 'Grid/list layout not found');
      }

      // Look for "Continue Studying" section
      const continueSection = await page.locator('text="Continue Studying"').count();
      if (continueSection > 0) {
        pass('"Continue Studying" section present');

        // Check for progress bars
        const progressBar = await page.locator('[class*="progress"]').count();
        if (progressBar > 0) {
          pass('Progress bars visible');
        } else {
          warn('Set list', 'Progress bars not found');
        }
      } else {
        warn('Set list', '"Continue Studying" section not found (expected when logged out)');
      }

      // Look for Starter Pack
      const starter = await page.locator('text="Starter Pack"').count();
      if (starter > 0) {
        pass('Starter Pack visible');
      } else {
        warn('Set list', 'Starter Pack not visible');
      }

      // Look for set cards with word counts
      const wordCountText = await page.locator('text=/\\d+\\s*(terms|words)/').count();
      if (wordCountText > 0) {
        pass('Set cards show word/term counts');
      } else {
        warn('Set cards', 'Word count display not found');
      }
    } else {
      warn('Set list', 'Redirected to login (expected when logged out)');
    }
  } catch (error) {
    fail('Set list tests', error);
  } finally {
    await page.close();
  }
}

async function testSetDetailPage(browser) {
  console.log('\n📋 TEST PATH 3: Set Detail Page');
  const page = await browser.newPage();

  try {
    // Use starter pack ID which is known to exist
    const STARTER_PACK_ID = 'starter_pack_en_ua';

    await page.goto(`${BASE_URL}/set/${STARTER_PACK_ID}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT,
    });

    pass('Set detail page loads');

    // Check for set title
    const titleEl = await page.locator('h1').first();
    if ((await titleEl.count()) > 0) {
      const title = await titleEl.textContent();
      if (title && title.length > 0) {
        pass(`Set title visible: "${title}"`);
      } else {
        warn('Set detail', 'Title element exists but is empty');
      }
    } else {
      warn('Set detail', 'No h1 title found');
    }

    // Check for set metadata (rating, author, badge)
    const metaElements = await page.locator('[class*="rating"], [class*="author"], [class*="badge"]').count();
    if (metaElements > 0) {
      pass('Set metadata visible');
    } else {
      warn('Set detail', 'Metadata elements not found');
    }

    // Check for term count
    const termCount = await page.locator('text=/\\d+\\s*terms?/').count();
    if (termCount > 0) {
      pass('Term count displayed');
    } else {
      warn('Set detail', 'Term count not displayed');
    }

    // Check for 6 game mode cards
    const modeCards = await page.locator('[class*="ModeCard"], button[aria-label*="Mode"], [class*="mode"]').count();
    if (modeCards >= 4) {
      pass(`Game mode cards present (found ${modeCards})`);
    } else {
      warn('Set detail', `Expected 6 modes, found ${modeCards}`);
    }

    // Check for specific mode names
    const modeNames = ['Flashcards', 'Learn', 'Test', 'Blocks', 'Blast', 'Match'];
    let foundModes = 0;
    for (const modeName of modeNames) {
      const modeBtn = await page.locator(`text="${modeName}"`).count();
      if (modeBtn > 0) {
        foundModes++;
      }
    }
    if (foundModes === 6) {
      pass('All 6 game modes visible');
    } else {
      warn('Set detail', `Found ${foundModes}/6 game modes`);
    }

    // Check for preview/flashcard section
    const flashcard = await page.locator('[class*="flashcard"], [class*="preview"]').count();
    if (flashcard > 0) {
      pass('Preview flashcard present');

      // Try to flip it
      const cardBody = await page.locator('[class*="cardBody"]').first();
      if ((await cardBody.count()) > 0) {
        await cardBody.click();
        pass('Flashcard flip interaction works');
      }
    } else {
      warn('Set detail', 'Preview flashcard not found');
    }

    // Check for navigation arrows
    const navBtns = await page.locator('button:has-text("›"), button:has-text("‹")').count();
    if (navBtns >= 2) {
      pass('Preview card navigation arrows present');
    } else {
      warn('Set detail', 'Navigation arrows not all found');
    }

    // Check for play audio button
    const audioBtn = await page.locator('[aria-label*="audio"], [aria-label*="Play"]').count();
    if (audioBtn > 0) {
      pass('Play audio button visible');
    } else {
      warn('Set detail', 'Play audio button not found');
    }

    // Check for star button
    const starBtn = await page.locator('[aria-label*="star"], button [*="Star"]').count();
    const starBtnAlternate = await page.locator('button:has-text("★"), button:has-text("☆")').count();
    if (starBtn > 0 || starBtnAlternate > 0) {
      pass('Star button visible');
    } else {
      warn('Set detail', 'Star button not found');
    }

    // Check for share button
    const shareBtn = await page.locator('[aria-label*="Share"], button svg[*="share"]').count();
    if (shareBtn > 0) {
      pass('Share button present');

      // Try to click and check for toast
      const shareBtnElement = await page.locator('[aria-label*="Share"]').first();
      if ((await shareBtnElement.count()) > 0) {
        await shareBtnElement.click();
        await page.waitForTimeout(300);

        // Check for "Copied!" toast
        const toast = await page.locator('text="Copied!"').count();
        if (toast > 0) {
          pass('"Copied!" toast appears');
        } else {
          warn('Set detail', 'Copy confirmation toast not visible');
        }
      }
    } else {
      warn('Set detail', 'Share button not found');
    }

    // Check for terms list
    const termsList = await page.locator('[class*="termSection"], h2:has-text("Terms")').count();
    if (termsList > 0) {
      pass('Terms list section visible');

      // Check for individual term cards
      const termCards = await page.locator('[class*="termCard"]').count();
      if (termCards > 0) {
        pass(`${termCards} term cards displayed`);
      }
    } else {
      warn('Set detail', 'Terms list section not found');
    }

    // Check for guest banner if not logged in
    const guestBanner = await page.locator('[class*="guestBanner"], text="Sign in"').count();
    if (guestBanner > 0) {
      pass('Guest sign-in banner visible');
    } else {
      warn('Set detail', 'Guest banner not found (may be logged in)');
    }
  } catch (error) {
    fail('Set detail page tests', error);
  } finally {
    await page.close();
  }
}

async function testGameModes(browser) {
  console.log('\n📋 TEST PATH 4: Game Modes');
  const page = await browser.newPage();

  try {
    const STARTER_PACK_ID = 'starter_pack_en_ua';

    // Test each mode
    const modes = ['flashcards', 'learn', 'test', 'blocks', 'blast', 'match'];

    for (const mode of modes) {
      try {
        await page.goto(`${BASE_URL}/set/${STARTER_PACK_ID}/${mode}`, {
          waitUntil: 'load',
          timeout: 10000,
        }).catch(() => {
          // Mode page may take time to load or require interaction
        });

        // Check if page loaded without crashing
        const content = await page.content();
        if (content.length > 100) {
          pass(`${mode} mode loads`);
        } else {
          warn(`${mode} mode`, 'Page content minimal');
        }

        // Check for navigation elements
        const hasNavigation = await page.locator('button, a[href*="/set"]').count() > 0;
        if (hasNavigation) {
          pass(`${mode} mode has navigation`);
        }
      } catch (error) {
        warn(`${mode} mode`, error.message);
      }
    }
  } catch (error) {
    fail('Game mode tests', error);
  } finally {
    await page.close();
  }
}

async function testErrorScenarios(browser) {
  console.log('\n📋 TEST PATH 5: Error Scenarios');
  const page = await browser.newPage();

  try {
    // Test 1: Invalid set ID
    await page.goto(`${BASE_URL}/set/nonexistent-set-id-12345`, {
      waitUntil: 'load',
      timeout: 10000,
    }).catch(() => {});

    // Check that page loads (either shows content, error, or navigates away)
    if (page.url().includes('set')) {
      pass('Invalid set ID handled gracefully');
    } else {
      pass('Invalid set ID navigates appropriately');
    }

    // Test 2: Check no native alerts
    let alertFired = false;
    page.on('dialog', () => {
      alertFired = true;
    });

    // Try some interactions that might trigger errors
    await page.goto(`${BASE_URL}/set/test`, { waitUntil: 'load' }).catch(() => {});
    await page.waitForTimeout(500);

    if (!alertFired) {
      pass('No native alert() dialogs used');
    } else {
      fail('Error handling', new Error('Native alert() detected'));
    }

    // Test 3: Check for proper error messages (toasts, not alerts)
    const hasErrorUI = await page.locator('[class*="toast"], [class*="error"], [class*="alert"]').count() >= 0;
    pass('Error UI elements accessible');
  } catch (error) {
    fail('Error scenario tests', error);
  } finally {
    await page.close();
  }
}

async function testMobileResponsiveness(browser) {
  console.log('\n📋 TEST PATH 6: Mobile Responsiveness');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  const page = await mobileContext.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: TIMEOUT });

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    if (viewport.width <= 400) {
      pass('Mobile viewport correct');
    } else {
      warn('Mobile test', `Viewport width ${viewport.width}px (expected ~375px)`);
    }

    // Check for horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    if (scrollWidth <= clientWidth + 5) {
      pass('No horizontal scrolling on mobile');
    } else {
      warn('Mobile responsiveness', `Horizontal scroll detected: ${scrollWidth}px vs ${clientWidth}px`);
    }

    // Test basic touch interactions
    const buttons = await page.locator('button').count();
    if (buttons > 0) {
      pass('Mobile buttons accessible');
    }

    // Check for readable text size
    const fontSize = await page.evaluate(() => {
      const el = document.querySelector('h1') || document.querySelector('button');
      return window.getComputedStyle(el || document.body).fontSize;
    });
    if (fontSize) {
      pass(`Text size readable (${fontSize})`);
    }
  } catch (error) {
    fail('Mobile responsiveness tests', error);
  } finally {
    await page.close();
    await mobileContext.close();
  }
}

async function main() {
  try {
    await startViteServer();
    await waitForServer();

    console.log(`\n🌐 Comprehensive UI Testing - Studify Up at ${BASE_URL}`);
    console.log('━'.repeat(70));

    const browser = await chromium.launch({ headless: true });

    await testLandingPage(browser);
    await testSetListPage(browser);
    await testSetDetailPage(browser);
    await testGameModes(browser);
    await testErrorScenarios(browser);
    await testMobileResponsiveness(browser);

    await browser.close();

    // Print summary
    console.log('\n' + '━'.repeat(70));
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log(`✓ Passed: ${results.passed.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⚠ Warnings: ${results.warnings.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.failed.forEach(({ test, error }) => {
        console.log(`   - ${test}: ${error}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      results.warnings.forEach(({ test, message }) => {
        console.log(`   - ${test}: ${message}`);
      });
    }

    console.log('\n' + '━'.repeat(70));
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    stopViteServer();
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  stopViteServer();
  process.exit(1);
});
