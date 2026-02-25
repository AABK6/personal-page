const { test, expect } = require('@playwright/test');

test('Sci-Po baseline visual regression', async ({ page }) => {
  // We'll use file URL for now since it's a local static site without a dev server configured yet
  const fileUrl = 'file://' + require('path').resolve(__dirname, '../scpo/index.html');
  await page.goto(fileUrl);
  
  // Wait for initial GSAP animations or other initial renders to settle
  await page.waitForTimeout(1000); 

  // Force GSAP animations to complete if GSAP is loaded
  await page.evaluate(() => {
    if (typeof gsap !== 'undefined') {
      gsap.globalTimeline.progress(1);
    }
  });

  // Wait a bit more to ensure any final renders are stable
  await page.waitForTimeout(500); 

  // Take a viewport screenshot to serve as a baseline for the creative suggestions
  // Increase maxDiffPixels or maxDiffPixelRatio if there are still minor rendering variations
  await expect(page).toHaveScreenshot('scpo-baseline.png', { maxDiffPixelRatio: 0.05, timeout: 30000 });
});
