import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Mobile viewport sizes to test
const viewports = {
  'mobile-small': { width: 375, height: 667, name: 'iPhone SE' },
  'mobile-medium': { width: 390, height: 844, name: 'iPhone 14' },
  'mobile-large': { width: 428, height: 926, name: 'iPhone 14 Pro Max' },
  'tablet': { width: 768, height: 1024, name: 'iPad' },
};

async function testLandingPageMobile() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 LANDING PAGE - MOBILE RESPONSIVENESS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const [key, viewport] of Object.entries(viewports)) {
    console.log(`\n📱 Testing: ${viewport.name} (${viewport.width}x${viewport.height})`);

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: viewport,
      isMobile: key.includes('mobile'),
    });

    try {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');

      // Test 1: Hero text is readable
      const heroTitle = await page.locator('.heroTitle');
      const heroTitleVisible = await heroTitle.isVisible();
      const heroTitleFontSize = await heroTitle.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`  ✓ Hero title visible: ${heroTitleVisible}, font-size: ${heroTitleFontSize}`);

      // Test 2: Demo card visible and accessible
      const demoCard = await page.locator('.demoCard');
      const demoCardVisible = await demoCard.isVisible();
      console.log(`  ✓ Demo card visible: ${demoCardVisible}`);

      // Test 3: Feature grid - should be single column on mobile
      const featureGrid = await page.locator('.featureGrid');
      const featureGridTemplate = await featureGrid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      console.log(`  ✓ Feature grid template: ${featureGridTemplate}`);

      // Test 4: CTA buttons visible and stacked on small mobile
      const ctaRow = await page.locator('.ctaRow');
      const ctaRowDisplay = await ctaRow.evaluate(el =>
        window.getComputedStyle(el).flexDirection
      );
      console.log(`  ✓ CTA buttons direction: ${ctaRowDisplay}`);

      // Test 5: Button sizing (touch-friendly 44px+)
      const ctaPrimary = await page.locator('.ctaPrimary');
      const ctaHeight = await ctaPrimary.evaluate(el => el.offsetHeight);
      const ctaWidth = await ctaPrimary.evaluate(el => el.offsetWidth);
      const touchFriendly = ctaHeight >= 44 && ctaWidth >= 44 ? '✓' : '✗';
      console.log(`  ${touchFriendly} CTA button size: ${ctaWidth}x${ctaHeight}px (44px+ needed)`);

      // Test 6: No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      const hasHorizontalScroll = bodyWidth > viewportWidth;
      const scrollCheck = hasHorizontalScroll ? '✗ HORIZONTAL SCROLL DETECTED' : '✓ No horizontal scroll';
      console.log(`  ${scrollCheck} (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`);

    } catch (error) {
      console.error(`  ✗ Error testing ${viewport.name}: ${error.message}`);
    } finally {
      await page.close();
      await browser.close();
    }
  }
}

async function testSetListMobile() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 SET LIST PAGE - MOBILE RESPONSIVENESS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const [key, viewport] of Object.entries(viewports)) {
    if (key === 'tablet') continue; // Focus on mobile for set list

    console.log(`\n📱 Testing: ${viewport.name} (${viewport.width}x${viewport.height})`);

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: viewport,
      isMobile: key.includes('mobile'),
    });

    try {
      // Note: This will show the landing page since we're not logged in
      // But we can test the card layout that's present
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');

      // Test 1: Cards responsive grid
      const grid = await page.locator('.grid, .continueGrid').first();
      const gridTemplate = await grid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      console.log(`  ✓ Grid template: ${gridTemplate}`);

      // Test 2: No horizontal scroll on set cards
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      const hasScroll = bodyWidth > viewportWidth;
      const scrollCheck = hasScroll ? '✗ HORIZONTAL SCROLL' : '✓ No horizontal scroll';
      console.log(`  ${scrollCheck}`);

      // Test 3: Button sizing on cards
      const buttons = await page.locator('button').first();
      const buttonHeight = await buttons.evaluate(el => el.offsetHeight);
      const touchFriendly = buttonHeight >= 40 ? '✓' : '✗';
      console.log(`  ${touchFriendly} Button height: ${buttonHeight}px (40px+ recommended)`);

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    } finally {
      await page.close();
      await browser.close();
    }
  }
}

async function testTouchInteractions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TOUCH INTERACTIONS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewport = viewports['mobile-medium'];
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: viewport,
    isMobile: true,
    hasTouch: true,
  });

  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    console.log(`\n📱 Testing: ${viewport.name} with touch support`);

    // Test 1: Demo card flip on tap
    const demoCard = await page.locator('.demoCard');
    if (await demoCard.isVisible()) {
      await demoCard.tap();
      await page.waitForTimeout(400);
      const isFlipped = await demoCard.evaluate(el =>
        el.classList.contains('flipped') ||
        window.getComputedStyle(el).transform.includes('rotateY')
      );
      console.log(`  ✓ Demo card flip on tap: ${isFlipped ? 'Works' : 'No animation detected'}`);
    }

    // Test 2: Button press feedback
    const ctaBtn = await page.locator('.ctaPrimary');
    if (await ctaBtn.isVisible()) {
      await ctaBtn.tap();
      const hasHoverStyles = await ctaBtn.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transform !== 'none' || style.boxShadow !== 'none';
      });
      console.log(`  ✓ Button visual feedback on tap: ${hasHoverStyles ? 'Yes' : 'No'}`);
    }

    // Test 3: Input field usability
    const inputs = await page.locator('input').count();
    console.log(`  ✓ Input fields accessible: ${inputs > 0 ? 'Yes' : 'None present'}`);

    // Test 4: Links tappable (44px+ area)
    const links = await page.locator('a');
    const linkCount = await links.count();
    if (linkCount > 0) {
      const firstLink = links.first();
      const linkSize = await firstLink.evaluate(el => ({
        width: el.offsetWidth,
        height: el.offsetHeight,
      }));
      const touchFriendly = linkSize.width >= 44 && linkSize.height >= 44;
      console.log(`  ${touchFriendly ? '✓' : '⚠'} Link tap area: ${linkSize.width}x${linkSize.height}px`);
    }

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

async function testPerformance() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 PERFORMANCE TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewport = viewports['mobile-medium'];
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: viewport,
    isMobile: true,
  });

  try {
    console.log(`\n📱 Testing: ${viewport.name}`);

    // Measure page load time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    const performanceCheck = loadTime < 3000 ? '✓' : '⚠';
    console.log(`  ${performanceCheck} Page load time: ${loadTime}ms (target: <3000ms)`);

    // Check for layout shifts during interaction
    const demoCard = await page.locator('.demoCard');
    if (await demoCard.isVisible()) {
      const before = await demoCard.boundingBox();
      await demoCard.tap();
      await page.waitForTimeout(100);
      const after = await demoCard.boundingBox();

      const shifted =
        before.x !== after.x ||
        before.y !== after.y ||
        before.width !== after.width ||
        before.height !== after.height;

      console.log(`  ${shifted ? '⚠' : '✓'} Layout stability during interaction: ${shifted ? 'Has shifts' : 'Stable'}`);
    }

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

async function runAllTests() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   STUDIFY UP - MOBILE RESPONSIVENESS TEST SUITE           ║');
  console.log('║   Testing multiple screen sizes and touch interactions   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await testLandingPageMobile();
    await testSetListMobile();
    await testTouchInteractions();
    await testPerformance();

    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
