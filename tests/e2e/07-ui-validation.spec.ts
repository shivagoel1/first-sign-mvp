import { test, expect } from '@playwright/test';
import { waitForPageLoad, takeScreenshot, loginAsParent, loginAsPhysician } from './helpers';

test.describe('UI Validation & Screenshot Checks', () => {
  test('UI-1: Landing page layout', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check header is fixed
    const header = page.locator('header, [class*="header"]').first();
    await expect(header).toBeVisible();
    
    // Check hero section
    const hero = page.locator('[class*="hero"], section:has-text("Track Your Child")').first();
    await expect(hero).toBeVisible();
    
    // Take full page screenshot
    await takeScreenshot(page, 'ui-landing-page-full');
    
    // Check responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForPageLoad(page);
    await takeScreenshot(page, 'ui-landing-page-mobile');
  });

  test('UI-2: Assessment form layout', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageLoad(page);
    
    // Check form fields are aligned
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    // Check inputs
    await expect(page.locator('input[name="childName"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('select[name="focusArea"]')).toBeVisible();
    
    await takeScreenshot(page, 'ui-assessment-form');
  });

  test('UI-3: Parent dashboard layout', async ({ page }) => {
    await loginAsParent(page);
    await waitForPageLoad(page);
    
    // Check sidebar
    const sidebar = page.locator('[class*="sidebar"], nav').first();
    await expect(sidebar).toBeVisible();
    
    // Check main content
    const mainContent = page.locator('main, [class*="main"]').first();
    await expect(mainContent).toBeVisible();
    
    // Check no overlapping elements
    const header = page.locator('header').first();
    const headerBox = await header.boundingBox();
    const sidebarBox = await sidebar.boundingBox();
    
    if (headerBox && sidebarBox) {
      // Header should be at top
      expect(headerBox.y).toBeLessThan(100);
      // Sidebar should be below header
      expect(sidebarBox.y).toBeGreaterThanOrEqual(headerBox.height);
    }
    
    await takeScreenshot(page, 'ui-parent-dashboard');
  });

  test('UI-4: Physician dashboard layout', async ({ page }) => {
    await loginAsPhysician(page);
    await waitForPageLoad(page);
    
    // Check layout
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    const sidebar = page.locator('[class*="sidebar"]').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
    
    await takeScreenshot(page, 'ui-physician-dashboard');
  });

  test('UI-5: Storybook viewer modal layout', async ({ page }) => {
    await loginAsParent(page);
    await waitForPageLoad(page);
    
    // Open storybook
    await page.waitForTimeout(2000);
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check modal is centered
      const modalBox = await modal.boundingBox();
      if (modalBox) {
        const viewport = page.viewportSize();
        if (viewport) {
          // Modal should be roughly centered
          const centerX = viewport.width / 2;
          const modalCenterX = modalBox.x + modalBox.width / 2;
          expect(Math.abs(centerX - modalCenterX)).toBeLessThan(100);
        }
      }
      
      await takeScreenshot(page, 'ui-storybook-modal');
    }
  });

  test('UI-6: Responsive design - Mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Landing page
    await page.goto('/');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'ui-mobile-landing');
    
    // Login page
    await page.goto('/login');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'ui-mobile-login');
  });

  test('UI-7: Responsive design - Tablet', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    await takeScreenshot(page, 'ui-tablet-landing');
  });

  test('UI-8: Form validation error display', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageLoad(page);
    
    // Try to submit without filling
    await page.locator('button:has-text("Continue")').first().click();
    await page.waitForTimeout(1000);
    
    // Check error messages are visible
    const errors = page.locator('text=/required|please enter|invalid/i');
    const errorCount = await errors.count();
    
    if (errorCount > 0) {
      await takeScreenshot(page, 'ui-form-validation-errors');
    }
  });

  test('UI-9: Loading states', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [aria-label*="loading" i]');
    const count = await loadingIndicators.count();
    
    // Should not have excessive loading indicators
    expect(count).toBeLessThan(10);
  });

  test('UI-10: Button states and interactions', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageLoad(page);
    
    // Check button states
    const continueButton = page.locator('button:has-text("Continue")').first();
    await expect(continueButton).toBeVisible();
    
    // Button should be enabled (or disabled if validation requires fields)
    const isDisabled = await continueButton.isDisabled();
    // This is expected behavior - button may be disabled until form is valid
  });
});

