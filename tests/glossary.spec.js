const { test, expect } = require('@playwright/test');

test.describe('Inline Concept Glossary', () => {
  test('Tooltip appears on hover (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/glossary.html');
    await page.goto(fileUrl);
    
    const term = page.locator('.glossary-term').first();
    const tooltip = term.locator('.glossary-tooltip');
    
    // Initially hidden
    await expect(tooltip).toBeHidden();
    
    // Hover over the term
    await term.hover();
    
    // Tooltip should be visible
    await expect(tooltip).toBeVisible();
    
    // It should contain the definition
    await expect(tooltip).toHaveText(/A political and economic doctrine/);
  });

  test('Tooltip appears on click/tap (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/glossary.html');
    await page.goto(fileUrl);
    
    const term = page.locator('.glossary-term').nth(1);
    const tooltip = term.locator('.glossary-tooltip');
    
    // Initially hidden
    await expect(tooltip).toBeHidden();
    
    // Tap the term
    await term.click();
    
    // Tooltip should be visible
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(/A piece of legislation/);
    
    // Tap outside to close
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(tooltip).toBeHidden();
  });
});