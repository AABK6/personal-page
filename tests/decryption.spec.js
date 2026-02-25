const { test, expect } = require('@playwright/test');

test('Text decrypts to final string', async ({ page }) => {
  const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/decryption.html');
  await page.goto(fileUrl);
  
  const target = page.locator('#target');
  
  // Wait for the decryption effect to complete and match the final text
  await expect(target).toHaveText('Hello World', { timeout: 3000 });
});