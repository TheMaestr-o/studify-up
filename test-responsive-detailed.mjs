import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function captureScreenshots() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📸 CAPTURING MOBILE SCREENSHOTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const viewports = {
    '375-mobile-se': { width: 375, height: 667, name: 'iPhone SE' },
    '390-mobile-14': { width: 390, height: 844, name: 'iPhone 14' },
    '768-tablet': { width: 768, height: 1024, name: 'iPad' },
  };

  for (const [key, viewport] of Object.entries(viewports)) {
    let browser, page;

    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage({
        viewport: viewport,
        isMobile: key.includes('mobile'),
      });

      page.setDefaultTimeout(20000);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const screenshotPath = `/tmp/studify-${key}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  ✓ Captured: ${viewport.name} → ${screenshotPath}`);

    } catch (error) {
      console.error(`  ✗ Error capturing ${viewport.name}: ${error.message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

async function testResponsiveDetails() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DETAILED RESPONSIVE ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const testCases = [
    { width: 375, height: 667, name: 'Mobile Small (375px)' },
    { width: 390, height: 844, name: 'Mobile Medium (390px)' },
    { width: 768, height: 1024, name: 'Tablet (768px)' },
  ];

  for (const viewport of testCases) {
    console.log(`\n🔍 ${viewport.name}:`);

    let browser, page;
    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.width < 768 });

      page.setDefaultTimeout(20000);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Detailed layout analysis
      const layoutAnalysis = await page.evaluate(() => {
        const hero = document.querySelector('.hero');
        const demoCard = document.querySelector('.demoCard');
        const buttons = Array.from(document.querySelectorAll('button'));
        const links = Array.from(document.querySelectorAll('a'));

        return {
          // Hero section
          hero: hero ? {
            display: window.getComputedStyle(hero).display,
            flexDirection: window.getComputedStyle(hero).flexDirection,
            padding: window.getComputedStyle(hero).padding,
            width: hero.offsetWidth,
            height: hero.offsetHeight,
          } : null,

          // Demo card
          demoCard: demoCard ? {
            visible: demoCard.offsetParent !== null,
            width: demoCard.offsetWidth,
            height: demoCard.offsetHeight,
            transform: window.getComputedStyle(demoCard).transform,
          } : null,

          // Buttons
          buttons: {
            count: buttons.length,
            minHeight: buttons.length ? Math.min(...buttons.map(b => b.offsetHeight || 44)) : 0,
            minWidth: buttons.length ? Math.min(...buttons.map(b => b.offsetWidth || 44)) : 0,
            avgHeight: buttons.length ? Math.round(buttons.reduce((sum, b) => sum + (b.offsetHeight || 0), 0) / buttons.length) : 0,
            touchFriendly: buttons.every(b => (b.offsetHeight || 44) >= 40 && (b.offsetWidth || 44) >= 40),
          },

          // Links
          links: {
            count: links.length,
            minHeight: links.length ? Math.min(...links.map(l => l.offsetHeight || 44)) : 0,
            minWidth: links.length ? Math.min(...links.map(l => l.offsetWidth || 44)) : 0,
          },

          // Viewport
          viewport: {
            bodyWidth: document.body.scrollWidth,
            htmlWidth: document.documentElement.scrollWidth,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
          },

          // Typography
          headings: {
            h1: document.querySelector('h1')?.offsetHeight,
            h2: document.querySelector('h2')?.offsetHeight,
            largestText: Math.max(...Array.from(document.querySelectorAll('h1, h2, h3, .heroTitle')).map(el => {
              const style = window.getComputedStyle(el);
              return parseInt(style.fontSize) || 0;
            })),
          },
        };
      });

      // Print analysis
      if (layoutAnalysis.hero) {
        console.log(`  Hero: ${layoutAnalysis.hero.flexDirection}, ${layoutAnalysis.hero.width}x${layoutAnalysis.hero.height}px`);
      }

      if (layoutAnalysis.demoCard) {
        console.log(`  Demo card: ${layoutAnalysis.demoCard.visible ? 'visible' : 'hidden'}, ${layoutAnalysis.demoCard.width}x${layoutAnalysis.demoCard.height}px`);
      }

      console.log(`  Buttons: ${layoutAnalysis.buttons.count} found, ${layoutAnalysis.buttons.touchFriendly ? '✓ touch-friendly' : '⚠ may be too small'} (avg ${layoutAnalysis.buttons.avgHeight}px high)`);

      const hasScroll = layoutAnalysis.viewport.bodyWidth > layoutAnalysis.viewport.windowWidth;
      console.log(`  Layout: ${hasScroll ? '⚠ horizontal scroll!' : '✓ no horizontal scroll'} (body: ${layoutAnalysis.viewport.bodyWidth}px, window: ${layoutAnalysis.viewport.windowWidth}px)`);

      console.log(`  Typography: largest font ${layoutAnalysis.headings.largestText}px`);

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

async function testCSSMediaQueries() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 CSS MEDIA QUERY EFFECTIVENESS TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const breakpoints = [
    { width: 375, name: '375px (Mobile)' },
    { width: 480, name: '480px (Small Mobile)' },
    { width: 640, name: '640px (Portrait Tablet)' },
    { width: 768, name: '768px (Tablet)' },
    { width: 1000, name: '1000px (Desktop)' },
  ];

  for (const bp of breakpoints) {
    let browser, page;
    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage({ viewport: { width: bp.width, height: 800 } });

      page.setDefaultTimeout(20000);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const gridColumns = await page.evaluate(() => {
        const grid = document.querySelector('.grid, .continueGrid');
        if (!grid) return 'N/A';
        return window.getComputedStyle(grid).gridTemplateColumns;
      });

      console.log(`  ${bp.name}: grid=${gridColumns}`);

    } catch (error) {
      console.error(`  ✗ Error at ${bp.name}: ${error.message}`);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   DETAILED MOBILE RESPONSIVENESS TESTING                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await testResponsiveDetails();
    await testCSSMediaQueries();
    await captureScreenshots();

    console.log('\n✅ Testing complete! Screenshots saved to /tmp/\n');
  } catch (error) {
    console.error('Test error:', error);
  }
}

runAllTests();
