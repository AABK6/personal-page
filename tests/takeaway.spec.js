const { test, expect } = require('@playwright/test');

test.describe('Print-Optimized Takeaway Generator', () => {
  test('Adds blocks to takeaway container and shows print button', async ({ page }) => {
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/takeaway.html');
    await page.goto(fileUrl);
    
    // Check that 'Save to Takeaway' buttons were injected
    const saveBtns = page.locator('.takeaway-save-btn');
    await expect(saveBtns).toHaveCount(2);
    
    // The print floating action button should initially be hidden (since 0 items saved)
    const printFab = page.locator('.takeaway-fab');
    await expect(printFab).toBeHidden();
    
    // Click the first save button
    await saveBtns.first().click();
    
    // Button state should change
    await expect(saveBtns.first()).toHaveText('Saved');
    await expect(saveBtns.first()).toHaveClass(/saved/);
    
    // FAB should now be visible and indicate 1 item
    await expect(printFab).toBeVisible();
    await expect(printFab).toContainText('Print 1 Takeaway');
    
    // Click the second save button
    await saveBtns.nth(1).click();
    await expect(printFab).toContainText('Print 2 Takeaways');
    
    // Deselect the first one
    await saveBtns.first().click();
    await expect(saveBtns.first()).toHaveText('Save to Takeaways');
    await expect(printFab).toContainText('Print 1 Takeaway');
  });
});