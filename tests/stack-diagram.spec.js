const { test, expect } = require('@playwright/test');

test.describe('Interactive Stack Diagram', () => {
  test('Layers highlight on scroll', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    const fileUrl = 'file://' + require('path').resolve(__dirname, 'fixtures/stack-diagram.html');
    await page.goto(fileUrl);
    
    // Check initial state (physical layer should be highlighted first if we are at the top of diagram)
    const physicalLayer = page.locator('.stack-layer.physical');
    const logicalLayer = page.locator('.stack-layer.logical');
    const appLayer = page.locator('.stack-layer.application');
    
    // Scroll to the diagram container and past it to trigger animations
    await page.evaluate(() => {
      const container = document.getElementById('stack-diagram-container');
      window.scrollTo(0, container.offsetTop);
    });
    
    // Wait for ScrollTrigger to potentially trigger initial state
    await page.waitForTimeout(1000);
    
    // Verify physical layer is active (it's the first one in scroll order)
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    await expect(physicalLayer).toHaveClass(/active/);
    
    // Scroll further down to activate logical layer
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    await expect(logicalLayer).toHaveClass(/active/);
    
    // Scroll further to activate application layer
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    await expect(appLayer).toHaveClass(/active/);
  });
});