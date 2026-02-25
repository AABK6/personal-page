const { test, expect } = require('@playwright/test');

test('Sci-Po baseline visual regression', async ({ page }) => {
  // We'll use file URL for now since it's a local static site without a dev server configured yet
  const fileUrl = 'file://' + require('path').resolve(__dirname, '../scpo/index.html');
  await page.goto(fileUrl);
  
  // Wait for initial GSAP animations or other initial renders to settle if necessary
  await page.waitForTimeout(1000); 

  // Take a viewport screenshot to serve as a baseline for the creative suggestions
  await expect(page).toHaveScreenshot('scpo-baseline.png', { timeout: 30000 });
});
