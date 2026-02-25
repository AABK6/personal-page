const { test, expect } = require('@playwright/test');

test.describe('Tufte-Style Sidenotes', () => {
  test('Desktop: Sidenotes are visible in the margin by default', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/sidenotes.html');
    await page.goto(fileUrl);
    
    const sidenote = page.locator('.sidenote');
    
    // On desktop, the sidenote should be visible without clicking anything
    await expect(sidenote).toBeVisible();
    
    // It should be positioned to the right of the main text column
    // We can check if it has an absolute position or float
    const display = await sidenote.evaluate((el) => window.getComputedStyle(el).display);
    // Usually Tufte notes are block/inline-block on desktop but moved to the right
    expect(display).not.toBe('none');
    
    const isAbsolute = await sidenote.evaluate((el) => window.getComputedStyle(el).position === 'absolute');
    expect(isAbsolute).toBeTruthy();
  });

  test('Mobile: Sidenotes are hidden by default and expand on click', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/sidenotes.html');
    await page.goto(fileUrl);
    
    const sidenote = page.locator('.sidenote');
    const trigger = page.locator('.sidenote-trigger');
    
    // On mobile, it should be hidden initially
    await expect(sidenote).toBeHidden();
    
    // Click the trigger
    await trigger.click();
    
    // Now it should be visible inline
    await expect(sidenote).toBeVisible();
    const isStaticOrRelative = await sidenote.evaluate((el) => {
      const pos = window.getComputedStyle(el).position;
      return pos === 'static' || pos === 'relative';
    });
    expect(isStaticOrRelative).toBeTruthy();
  });
});
