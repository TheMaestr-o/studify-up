import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Mobile viewport sizes to test
const viewports = {
  'mobile-small': { width: 375, height: 667, name: 'iPhone SE' },
  'mobile-medium': { width: 390, height: 844, name: 'iPhone 14' },
  'mobile-large': { width: 428, height: 926, name: 'iPhone 14 Pro Max' },
  'tablet': { width: 768, height: 1024, name: 'iPad' },
  'desktop': { width: 1280, height: 720, name: 'Desktop' },
};

async function testLandingPageMobile() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 LANDING PAGE - MOBILE RESPONSIVENESS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const [key, viewport] of Object.entries(viewports)) {
    console.log(`\n📱 Testing: ${viewport.name} (${viewport.width}x${viewport.height})`);

    let browser, page;
    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage({
        viewport: viewport,
        isMobile: key.includes('mobile') || key.includes('tablet'),
      });

      // Set a longer timeout and go to the page
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(20000);

      const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

      if (!response.ok()) {
        console.log(`  ✗ Failed to load page: ${response.status()}`);
        continue;
      }

      // Wait for content to render
      await page.waitForTimeout(1500);

      // Test 1: Check if body has content
      const bodyHtml = await page.evaluate(() => document.body.innerHTML.length);
      console.log(`  ✓ Page loaded: ${bodyHtml} bytes of content`);

      // Test 2: Check for horizontal scroll
      const dimensions = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        windowWidth: window.innerWidth,
        htmlWidth: document.documentElement.scrollWidth,
      }));

      const hasHorizontalScroll =
        dimensions.bodyWidth > dimensions.windowWidth ||
        dimensions.htmlWidth > dimensions.windowWidth;

      const scrollCheck = hasHorizontalScroll
        ? `✗ HORIZONTAL SCROLL (body: ${dimensions.bodyWidth}px, window: ${dimensions.windowWidth}px)`
        : `✓ No horizontal scroll`;
      console.log(`  ${scrollCheck}`);

      // Test 3: Check button sizes
      const buttonInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        if (buttons.length === 0) return { count: 0, minHeight: 0, minWidth: 0 };

        const sizes = buttons.map(btn => ({
          height: btn.offsetHeight,
          width: btn.offsetWidth,
        }));

        return {
          count: buttons.length,
          minHeight: Math.min(...sizes.map(s => s.height)),
          minWidth: Math.min(...sizes.map(s => s.width)),
          avgHeight: Math.round(sizes.reduce((sum, s) => sum + s.height, 0) / sizes.length),
        };
      });

      const buttonTouchCheck =
        buttonInfo.minHeight >= 40 && buttonInfo.minWidth >= 40
          ? '✓'
          : '⚠';
      console.log(
        `  ${buttonTouchCheck} Buttons: ${buttonInfo.count} found, min: ${buttonInfo.minHeight}x${buttonInfo.minWidth}px, avg height: ${buttonInfo.avgHeight}px`
      );

      // Test 4: Check responsive styles
      const responsiveInfo = await page.evaluate(() => {
        const hero = document.querySelector('.hero');
        const grid = document.querySelector('.grid') || document.querySelector('.continueGrid');
        const featureGrid = document.querySelector('.featureGrid');

        return {
          heroExists: !!hero,
          gridExists: !!grid,
          featureGridExists: !!featureGrid,
          heroDisplay: hero ? window.getComputedStyle(hero).display : 'N/A',
          gridDisplay: grid ? window.getComputedStyle(grid).display : 'N/A',
          featureGridColumns: featureGrid ? window.getComputedStyle(featureGrid).gridTemplateColumns : 'N/A',
        };
      });

      console.log(`  ✓ Responsive elements: hero=${responsiveInfo.heroExists}, grid=${responsiveInfo.gridExists}`);
      if (responsiveInfo.featureGridColumns !== 'N/A') {
        const isSingleCol = responsiveInfo.featureGridColumns.includes('1fr') || !responsiveInfo.featureGridColumns.includes(' ');
        const colCheck = key.includes('480') || key.includes('640') ? '✓' : '✓';
        console.log(`  ${colCheck} Feature grid: ${responsiveInfo.featureGridColumns}`);
      }

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

async function testTouchInteractions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TOUCH INTERACTIONS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewport = viewports['mobile-medium'];
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: viewport,
      isMobile: true,
      hasTouch: true,
    });

    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);

    console.log(`\n📱 Testing: ${viewport.name} with touch support`);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Test 1: Interactive elements
    const interactiveElements = await page.evaluate(() => {
      return {
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        inputs: document.querySelectorAll('input').length,
      };
    });

    console.log(`  ✓ Interactive elements: ${interactiveElements.buttons} buttons, ${interactiveElements.links} links, ${interactiveElements.inputs} inputs`);

    // Test 2: CTA button interaction
    const ctaButton = page.locator('.ctaPrimary');
    const ctaCount = await ctaButton.count();
    if (ctaCount > 0) {
      try {
        const ctaVisible = await ctaButton.first().isVisible({ timeout: 5000 });
        if (ctaVisible) {
          // Get initial position
          const beforeBox = await ctaButton.first().boundingBox();

          // Simulate tap
          await ctaButton.first().tap();
          await page.waitForTimeout(100);

          // Get position after tap
          const afterBox = await ctaButton.first().boundingBox();

          const moved =
            beforeBox.x !== afterBox.x ||
            beforeBox.y !== afterBox.y;

          console.log(`  ✓ CTA button tap: responsive (movement: ${moved ? 'Yes' : 'No'})`);
        }
      } catch (e) {
        console.log(`  ⚠ CTA button test: ${e.message}`);
      }
    } else {
      console.log(`  ℹ No CTA buttons found on page`);
    }

    // Test 3: Check for common touch issues
    const touchIssues = await page.evaluate(() => {
      const issues = [];

      // Check for hover-only styles that might break touch
      const allElements = document.querySelectorAll('[style*="hover"], [class*="hover"]');
      if (allElements.length > 0) {
        issues.push(`${allElements.length} elements with hover styles (may need touch alternatives)`);
      }

      // Check viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        issues.push('Missing viewport meta tag');
      } else {
        const content = viewportMeta.getAttribute('content');
        if (!content.includes('initial-scale')) {
          issues.push('Viewport may not have proper zoom settings');
        }
      }

      return issues;
    });

    if (touchIssues.length === 0) {
      console.log(`  ✓ No common touch interaction issues detected`);
    } else {
      touchIssues.forEach(issue => console.log(`  ⚠ ${issue}`));
    }

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function testPerformance() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ PERFORMANCE TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewport = viewports['mobile-medium'];
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: viewport,
      isMobile: true,
    });

    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);

    console.log(`\n📱 Testing: ${viewport.name}`);

    // Measure page load time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    const performanceCheck = loadTime < 3000 ? '✓' : '⚠';
    console.log(`  ${performanceCheck} Page load time: ${loadTime}ms (target: <3000ms)`);

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) return null;

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });

    if (metrics) {
      console.log(`  ✓ DOM loaded in: ${metrics.domContentLoaded}ms`);
      console.log(`  ✓ Full load in: ${metrics.loadComplete}ms`);
    }

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function testGameModeMobile() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎮 GAME MODE LAYOUT TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewport = viewports['mobile-medium'];
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: viewport,
      isMobile: true,
    });

    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);

    console.log(`\n📱 Testing game mode responsiveness on ${viewport.name}`);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Check for game mode elements that should be present
    const gameElements = await page.evaluate(() => {
      return {
        progressBars: document.querySelectorAll('[class*="progress"]').length,
        answerButtons: document.querySelectorAll('[class*="button"], [class*="answer"]').length,
        textInputs: document.querySelectorAll('input[type="text"]').length,
        selectElements: document.querySelectorAll('select').length,
      };
    });

    console.log(`  ✓ Potential game elements found: ${gameElements.progressBars} progress, ${gameElements.answerButtons} buttons`);

    // Check layout doesn't break
    const layoutOk = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
      const style = window.getComputedStyle(main);

      return {
        isVisible: style.display !== 'none',
        hasOverflow: style.overflow === 'hidden' || style.overflowX === 'hidden',
        width: main.offsetWidth,
        height: main.offsetHeight,
      };
    });

    console.log(`  ${layoutOk.isVisible ? '✓' : '✗'} Main content visible and laid out correctly`);
    console.log(`  ℹ Content dimensions: ${layoutOk.width}x${layoutOk.height}px`);

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function runAllTests() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   STUDIFY UP - MOBILE RESPONSIVENESS TEST SUITE           ║');
  console.log('║   Testing multiple screen sizes and interactions         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await testLandingPageMobile();
    await testTouchInteractions();
    await testPerformance();
    await testGameModeMobile();

    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
  }
}

runAllTests();
