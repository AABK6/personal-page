const { test, expect } = require('@playwright/test');

test.describe('Perspective Switcher Toggle', () => {
  test('Toggles visibility and background tint based on selected perspective', async ({ page }) => {
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/perspective.html');
    await page.goto(fileUrl);
    
    // Check if the buttons were generated
    const btnWash = page.locator('button[data-perspective="Washington"]');
    const btnBeijing = page.locator('button[data-perspective="Beijing"]');
    
    await expect(btnWash).toBeVisible();
    await expect(btnBeijing).toBeVisible();
    
    // Initially, both specific contents are hidden (or maybe Washington is default)
    const contentWash = page.locator('.perspective-content.Washington');
    const contentBeijing = page.locator('.perspective-content.Beijing');
    
    // Let's click Washington
    await btnWash.click();
    await expect(contentWash).toBeVisible();
    
    // Background tint should be applied to the section
    const section = page.locator('.perspective-section');
    await expect(section).toHaveAttribute('data-active-perspective', 'Washington');
    
    // Now click Beijing
    await btnBeijing.click();
    await expect(contentBeijing).toBeVisible();
    await expect(contentWash).toBeHidden();
    await expect(section).toHaveAttribute('data-active-perspective', 'Beijing');
  });
});