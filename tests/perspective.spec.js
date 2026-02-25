const { test, expect } = require('@playwright/test');

test.describe('Perspective Switcher Toggle', () => {
  test('Toggles visibility and background tint based on selected perspective', async ({ page }) => {
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/perspective.html');
    await page.goto(fileUrl);
    
    // Check if the buttons were generated
    const btnWash = page.locator('button[data-perspective="washington"]');
    const btnBrazil = page.locator('button[data-perspective="brazil"]');
    
    await expect(btnWash).toBeVisible();
    await expect(btnBrazil).toBeVisible();
    
    // Initially, both specific contents are hidden (or maybe Washington is default)
    const contentWash = page.locator('.perspective-content.washington');
    const contentBrazil = page.locator('.perspective-content.brazil');
    
    // Let's click Washington
    await btnWash.click();
    await expect(contentWash).toBeVisible();
    await expect(contentBrazil).toBeHidden();
    
    // Background tint should be applied to the section
    const section = page.locator('.perspective-section');
    await expect(section).toHaveAttribute('data-active-perspective', 'washington');
    
    // Now click Brazil
    await btnBrazil.click();
    await expect(contentBrazil).toBeVisible();
    await expect(contentWash).toBeHidden();
    await expect(section).toHaveAttribute('data-active-perspective', 'brazil');
  });
});