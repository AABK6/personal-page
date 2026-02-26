const { test, expect } = require('@playwright/test');

test.describe('Non-Rivalrous Good Visualizer', () => {
  test('Rival good disappears on click, Non-rival good duplicates', async ({ page }) => {
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/non-rivalrous.html');
    await page.goto(fileUrl);
    
    const rivalGood = page.locator('#rival-good');
    const apple = page.locator('.apple-container');
    
    const nonRivalGood = page.locator('#non-rival-good');
    const codeItems = page.locator('.code-container code');
    
    // Test Rival Good: Apple should disappear or show 'Empty'
    await rivalGood.click();
    await expect(apple).toContainText('💨'); // Or some 'consumed' state
    await rivalGood.click();
    // Subsequent clicks should remain consumed
    
    // Test Non-Rival Good: Code should duplicate
    await expect(codeItems).toHaveCount(1);
    
    await nonRivalGood.click();
    await expect(codeItems).toHaveCount(2);
    
    await nonRivalGood.click();
    await expect(codeItems).toHaveCount(4);
    
    await nonRivalGood.click();
    await expect(codeItems).toHaveCount(8);
  });
});