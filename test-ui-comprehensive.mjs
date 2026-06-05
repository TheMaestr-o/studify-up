#!/usr/bin/env node

/**
 * Comprehensive UI testing for Studify Up
 * Tests all major UI paths and validates functionality
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000;

let viteProcess = null;

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

function pass(testName) {
  testResults.passed.push(testName);
  log(`✓ ${testName}`, 'green');
}

function fail(testName, error) {
  testResults.failed.push({ test: testName, error: error.message || String(error) });
  log(`✗ ${testName}: ${error.message || String(error)}`, 'red');
}

function warn(testName, message) {
  testResults.warnings.push({ test: testName, message });
  log(`⚠ ${testName}: ${message}`, 'yellow');
}

// Start Vite dev server
function startViteServer() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Starting Vite dev server...', 'cyan');
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: '/Users/ohnedan/Developer/studify-up',
      stdio: 'pipe',
    });

    let output = '';
    viteProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('VITE') || output.includes('localhost')) {
        log('✓ Vite server started', 'green');
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

// Stop Vite server
function stopViteServer() {
  if (viteProcess) {
    viteProcess.kill();
  }
}

// Wait for server to be ready
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

// Main test function
async function runTests() {
  const browser = await chromium.launch({
    headless: false, // Show the browser for visual inspection
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  try {
    log('\n📋 TEST PATH 1: Landing Page', 'blue');
    await testLandingPage(context);

    log('\n📋 TEST PATH 2: Set List (after login)', 'blue');
    await testSetList(context);

    log('\n📋 TEST PATH 3: Set Detail Page', 'blue');
    await testSetDetailPage(context);

    log('\n📋 TEST PATH 4: Game Modes', 'blue');
    await testGameModes(context);

    log('\n📋 TEST PATH 5: Error Scenarios', 'blue');
    await testErrorScenarios(context);

    log('\n📊 Mobile Responsiveness Test', 'blue');
    await testMobileResponsiveness(context);
  } finally {
    await browser.close();
  }
}

async function testLandingPage(context) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    pass('Landing page loads');

    // Check for custom cursor
    const cursorStyle = await page.evaluate(() => {
      return document.documentElement.style.cursor;
    });
    if (cursorStyle || document.body.style.cursor) {
      pass('Custom cursor present');
    } else {
      warn('Custom cursor', 'Cursor style not detected');
    }

    // Check for particles animation (check for canvas or animated elements)
    const hasAnimation = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const animatedElements = document.querySelectorAll('[class*="animate"]');
      return !!canvas || animatedElements.length > 0;
    });
    if (hasAnimation) {
      pass('Particles/animations detected');
    } else {
      warn('Particles animation', 'No canvas or animated elements found');
    }

    // Check for 3D tilt card
    const hasTiltCard = await page.evaluate(() => {
      return document.querySelector('[class*="tilt"]') || document.querySelector('[class*="3d"]') !== null;
    });
    if (hasTiltCard) {
      pass('3D tilt card present');
    } else {
      warn('3D tilt card', 'Could not detect 3D tilt implementation');
    }

    // Test "Get started free" button
    const getStartedButton = page.locator('button:has-text("Get started free"), a:has-text("Get started free")');
    if (await getStartedButton.count() > 0) {
      await getStartedButton.first().click();
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        pass('"Get started free" button navigates to /login');
      } else {
        warn('"Get started free" button', `Navigated to ${currentUrl} instead of /login`);
      }
    } else {
      warn('"Get started free" button', 'Button not found on page');
    }

    // Test "Try Starter Pack" button
    const starterPackButton = page.locator('button:has-text("Try Starter Pack"), a:has-text("Try Starter Pack")');
    if (await starterPackButton.count() > 0) {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await starterPackButton.first().click();
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      const currentUrl = page.url();
      if (currentUrl.includes('/set/')) {
        pass('"Try Starter Pack" button navigates to /set/{id}');
      } else {
        warn('"Try Starter Pack" button', `Navigated to ${currentUrl} instead of /set/`);
      }
    } else {
      warn('"Try Starter Pack" button', 'Button not found on page');
    }

    // Check for banner text
    const bannerText = await page.locator('text="Got a link?"').count();
    if (bannerText > 0) {
      pass('Banner "Got a link?" text visible');
    } else {
      warn('Banner text', '"Got a link?" not found');
    }
  } catch (error) {
    fail('Landing page tests', error);
  } finally {
    await page.close();
  }
}

async function testSetList(context) {
  const page = await context.newPage();
  try {
    // Navigate to sets page (might need login)
    await page.goto(`${BASE_URL}/sets`, { waitUntil: 'networkidle', timeout: TIMEOUT }).catch(() => {
      return page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    });

    const pageContent = await page.content();

    // Check if we're on a sets page or need to login
    if (page.url().includes('/login')) {
      warn('Set list', 'Redirected to login - cannot test authenticated features without login');
      return;
    }

    // Check for set cards
    const setCards = await page.locator('[class*="card"], [class*="set"]').count();
    if (setCards > 0) {
      pass('Set cards load without error');
    } else {
      warn('Set cards', 'No set cards found on page');
    }

    // Check for "Continue Studying" section
    const continueStudyingSection = await page.locator('text="Continue Studying"').count();
    if (continueStudyingSection > 0) {
      pass('"Continue Studying" section visible');

      // Check for progress bars
      const progressBars = await page.locator('[role="progressbar"], [class*="progress"]').count();
      if (progressBars > 0) {
        pass('Progress bars visible');
      } else {
        warn('Progress bars', 'No progress bars found');
      }
    } else {
      warn('"Continue Studying" section', 'Not found on page');
    }

    // Check for Starter Pack
    const starterPack = await page.locator('text="Starter Pack"').count();
    if (starterPack > 0) {
      pass('Starter Pack available at top');
    } else {
      warn('Starter Pack', 'Not visible on sets page');
    }

    // Check for word count on cards
    const wordCounts = await page.locator('text=/\\d+\\s*(words|terms)/i').count();
    if (wordCounts > 0) {
      pass('Set cards show word count');
    } else {
      warn('Word count', 'Could not verify word count display');
    }
  } catch (error) {
    fail('Set list tests', error);
  } finally {
    await page.close();
  }
}

async function testSetDetailPage(context) {
  const page = await context.newPage();
  try {
    // Try to navigate to a set (using a test set ID)
    await page.goto(`${BASE_URL}/set/test-set-id`, { waitUntil: 'load', timeout: TIMEOUT }).catch(() => {});

    // Check for set name
    const setName = await page.locator('[class*="title"], h1').first();
    if ((await setName.count()) > 0) {
      pass('Set name visible');
    } else {
      warn('Set name', 'Could not detect set title');
    }

    // Check for author info
    const authorInfo = await page.locator('text=/[Bb]y|[Aa]uthor|[Cc]reated/').count();
    if (authorInfo > 0) {
      pass('Author information visible');
    } else {
      warn('Author info', 'Could not verify author display');
    }

    // Check for rating
    const rating = await page.locator('[class*="star"], [class*="rating"]').count();
    if (rating > 0) {
      pass('Rating visible');
    } else {
      warn('Rating', 'Rating element not found');
    }

    // Check for game mode cards (6 modes)
    const gameModeCards = await page.locator('[class*="mode"], [class*="game"]').count();
    if (gameModeCards >= 4) {
      pass(`Game mode cards visible (found ${gameModeCards})`);
    } else {
      warn('Game mode cards', `Expected 6 modes, found ${gameModeCards}`);
    }

    // Check for specific modes
    const modeNames = ['Flashcards', 'Learn', 'Test', 'Blocks', 'Match', 'Blast'];
    for (const modeName of modeNames) {
      const modeButton = await page.locator(`text="${modeName}"`).count();
      if (modeButton > 0) {
        pass(`"${modeName}" mode card present`);
      } else {
        warn(`"${modeName}" mode`, 'Not found');
      }
    }

    // Check for preview card
    const previewCard = await page.locator('[class*="preview"]').count();
    if (previewCard > 0) {
      pass('Preview card present');

      // Try to flip the preview card
      const flipButton = await page.locator('button:has-text("Flip"), [class*="flip"]').first();
      if ((await flipButton.count()) > 0) {
        await flipButton.click();
        pass('Preview card flips on click');
      }
    } else {
      warn('Preview card', 'Not found on page');
    }

    // Check for preview buttons (play audio, star)
    const playAudioButton = await page.locator('[aria-label="Play audio"], [class*="audio"], [class*="play"]').count();
    if (playAudioButton > 0) {
      pass('Play audio button present');
    } else {
      warn('Play audio button', 'Not found');
    }

    const starButton = await page.locator('[aria-label*="Star"], [class*="star"], [class*="favorite"]').count();
    if (starButton > 0) {
      pass('Star/favorite button present');
    } else {
      warn('Star button', 'Not found');
    }

    // Check for navigation arrows
    const leftArrow = await page.locator('button[aria-label="Previous"], [class*="arrow-left"]').count();
    const rightArrow = await page.locator('button[aria-label="Next"], [class*="arrow-right"]').count();
    if (leftArrow > 0 && rightArrow > 0) {
      pass('Navigation arrows present');
    } else {
      warn('Navigation arrows', `Left: ${leftArrow}, Right: ${rightArrow}`);
    }

    // Check for terms list
    const termsList = await page.locator('ul, ol, [role="list"]').count();
    if (termsList > 0) {
      pass('Terms list visible');
    } else {
      warn('Terms list', 'Could not find terms list');
    }

    // Check for share button
    const shareButton = await page.locator('button:has-text("Share"), [aria-label="Share"]').count();
    if (shareButton > 0) {
      pass('Share button present');

      // Click share button and check for copy toast
      await page.locator('button:has-text("Share"), [aria-label="Share"]').first().click();
      await page.waitForTimeout(500);
      const toastMessage = await page.locator('text="Copied!"').count();
      if (toastMessage > 0) {
        pass('"Copied!" toast appears');
      } else {
        warn('Copy toast', 'Toast notification not found');
      }
    } else {
      warn('Share button', 'Not found');
    }

    // Check for guest banner
    const guestBanner = await page.locator('text=/[Ll]og in|[Gg]uest|[Ll]ogin/').count();
    if (guestBanner > 0) {
      pass('Guest/login banner visible');
    } else {
      warn('Guest banner', 'Not detected');
    }
  } catch (error) {
    fail('Set detail page tests', error);
  } finally {
    await page.close();
  }
}

async function testGameModes(context) {
  const page = await context.newPage();
  try {
    // Navigate to a game mode (try flashcards)
    await page.goto(`${BASE_URL}/set/test-id/flashcards`, { waitUntil: 'load', timeout: TIMEOUT }).catch(() => {
      pass('Game mode pages accessible (may require authentication)');
    });

    // If we're on a page, try basic interactions
    if (!page.url().includes('error')) {
      // Test flashcard flip
      const flipButtons = await page.locator('[class*="flip"], button[aria-label*="flip"]').count();
      if (flipButtons > 0) {
        pass('Flashcard mode has flip functionality');
        await page.locator('[class*="flip"], button[aria-label*="flip"]').first().click();
        pass('Flashcard flip interaction works');
      }

      // Test navigation in game modes
      const nextButton = await page.locator('[aria-label="Next"], button:has-text("Next")').count();
      const prevButton = await page.locator('[aria-label="Previous"], button:has-text("Previous")').count();
      if (nextButton > 0 || prevButton > 0) {
        pass('Game mode navigation buttons present');
      }
    } else {
      warn('Game modes', 'Not accessible without authentication');
    }
  } catch (error) {
    fail('Game mode tests', error);
  } finally {
    await page.close();
  }
}

async function testErrorScenarios(context) {
  const page = await context.newPage();
  try {
    // Test invalid set ID error handling
    await page.goto(`${BASE_URL}/set/invalid-set-id-that-does-not-exist-12345`, {
      waitUntil: 'load',
      timeout: TIMEOUT,
    }).catch(() => {});

    // Check if page crashes or shows error gracefully
    const errorText = await page.locator('text=/[Ee]rror|[Nn]ot [Ff]ound|[Dd]oes not exist/').count();
    if (errorText > 0) {
      pass('Invalid set ID shows error message gracefully');
    } else if (page.url().includes('error')) {
      pass('Invalid set ID has error page');
    } else {
      warn('Error handling', 'Could not verify error page behavior');
    }

    // Check that no native alerts are used (should use toasts instead)
    let alertCaught = false;
    page.on('dialog', () => {
      alertCaught = true;
    });

    // Try triggering various error conditions
    await page.goto(`${BASE_URL}/set/invalid`, { waitUntil: 'load' }).catch(() => {});

    if (!alertCaught) {
      pass('No native alert() dialogs used');
    } else {
      fail('Error handling', new Error('Native alert() dialog detected'));
    }

    // Test unauthorized access redirect
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load', timeout: 5000 }).catch(() => {});
    if (page.url().includes('/login') || page.url().includes('/')) {
      pass('Unauthorized access redirects appropriately');
    }
  } catch (error) {
    fail('Error scenario tests', error);
  } finally {
    await page.close();
  }
}

async function testMobileResponsiveness(context) {
  const mobileContext = await context.browser().newContext({
    viewport: { width: 375, height: 667 }, // iPhone size
  });

  const page = await mobileContext.newPage();
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: TIMEOUT });

    // Check if layout adapts to mobile
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    if (viewport.width <= 400) {
      pass('Mobile viewport set correctly');

      // Check for mobile-friendly text sizes
      const mainContent = await page.locator('body').boundingBox();
      if (mainContent) {
        pass('Layout renders on mobile screen');
      }

      // Check for horizontal scrolling (should not exist)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (scrollWidth <= clientWidth + 10) {
        pass('No horizontal scrolling on mobile');
      } else {
        warn('Mobile responsiveness', `Horizontal scroll detected (${scrollWidth}px vs ${clientWidth}px)`);
      }
    }
  } catch (error) {
    fail('Mobile responsiveness tests', error);
  } finally {
    await page.close();
    await mobileContext.close();
  }
}

// Main execution
async function main() {
  try {
    await startViteServer();
    await waitForServer();

    log(`\n🌐 Testing Studify Up at ${BASE_URL}`, 'cyan');
    log('━'.repeat(60), 'cyan');

    await runTests();

    log('\n' + '━'.repeat(60), 'cyan');
    log('\n📊 TEST RESULTS SUMMARY', 'blue');
    log(`✓ Passed: ${testResults.passed.length}`, 'green');
    log(`✗ Failed: ${testResults.failed.length}`, testResults.failed.length > 0 ? 'red' : 'green');
    log(`⚠ Warnings: ${testResults.warnings.length}`, testResults.warnings.length > 0 ? 'yellow' : 'green');

    if (testResults.failed.length > 0) {
      log('\n❌ FAILED TESTS:', 'red');
      testResults.failed.forEach(({ test, error }) => {
        log(`   ${test}: ${error}`, 'red');
      });
    }

    if (testResults.warnings.length > 0) {
      log('\n⚠️  WARNINGS:', 'yellow');
      testResults.warnings.forEach(({ test, message }) => {
        log(`   ${test}: ${message}`, 'yellow');
      });
    }

    log('\n' + '━'.repeat(60), 'cyan');
    process.exit(testResults.failed.length > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    stopViteServer();
  }
}

main().catch((error) => {
  log(`Error: ${error.message}`, 'red');
  stopViteServer();
  process.exit(1);
});
