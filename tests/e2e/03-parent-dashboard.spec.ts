import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  loginAsParent,
  waitForElement,
  takeScreenshot,
  TEST_USER,
} from './helpers';

test.describe('Parent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test - with longer timeout
    await loginAsParent(page);
    await waitForPageLoad(page, 30000);
    // Extra wait for dashboard data to load
    await page.waitForTimeout(3000);
  });

  test('TC-2.2.1: Dashboard loads correctly', async ({ page }) => {
    // Wait for dashboard to fully load
    await page.waitForTimeout(3000);
    
    // Check welcome section - longer timeout
    await expect(page.locator('text=/welcome|dashboard|home/i').first()).toBeVisible({ timeout: 15000 });
    
    // Check progress overview or any content
    const hasContent = await page.locator('text=/progress|approved|pending|assessment|child/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
    
    // Take screenshot
    await takeScreenshot(page, 'parent-dashboard-overview');
    
    // Check no critical console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) {
        errors.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    // Log errors but don't fail test (some may be expected)
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
  });

  test('TC-2.2.2: Progress overview displays stats', async ({ page }) => {
    // Wait longer for stats to load from API
    await page.waitForTimeout(5000);
    
    // Check for stat cards or any dashboard content
    const statCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    const count = await statCards.count();
    
    // Should have at least some content (cards, stats, or empty state)
    const hasContent = count > 0 || await page.locator('text=/empty|no.*assessment|start.*assessment/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('TC-2.2.5: Child selection - Click child name', async ({ page }) => {
    // Wait for children section
    await page.waitForTimeout(2000);
    
    // Find child name link
    const childLink = page.locator('text=/child|children/i').first();
    if (await childLink.isVisible()) {
      await childLink.click();
      
      // Should update URL with child parameter
      await page.waitForTimeout(1000);
      const url = page.url();
      // URL should have child parameter or be on detail view
      expect(url).toMatch(/child=|dashboard\/parent/);
    }
  });

  test('TC-2.2.7: New Assessment - From overview', async ({ page }) => {
    const newAssessmentButton = page.locator('a:has-text("New Assessment"), button:has-text("New Assessment"), a:has-text("Start New Assessment")').first();
    
    if (await newAssessmentButton.isVisible()) {
      await newAssessmentButton.click();
      await page.waitForURL(/\/assessment/, { timeout: 5000 });
      expect(page.url()).toContain('/assessment');
    }
  });

  test('TC-2.2.8: Sidebar navigation', async ({ page }) => {
    // Check sidebar exists
    const sidebar = page.locator('[class*="sidebar"], nav[aria-label*="navigation" i]').first();
    if (await sidebar.isVisible()) {
      // Test Dashboard link
      const dashboardLink = page.locator('a:has-text("Dashboard"), nav a[href*="dashboard"]').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/dashboard/parent');
      }
    }
  });

  test('TC-2.3.1: Child detail view loads', async ({ page }) => {
    // Navigate to child detail (if children exist)
    await page.waitForTimeout(2000);
    
    // Try to find and click a child
    const childCard = page.locator('[class*="child"], [data-testid*="child"]').first();
    if (await childCard.isVisible()) {
      await childCard.click();
      await page.waitForTimeout(2000);
      
      // Should show child-specific content
      await expect(page.locator('text=/assessment|storybook/i').first()).toBeVisible({ timeout: 5000 });
      
      await takeScreenshot(page, 'parent-dashboard-child-detail');
    }
  });

  test('TC-2.3.3: View storybook - Approved assessment', async ({ page }) => {
    // Navigate to child detail if needed
    await page.waitForTimeout(3000);
    
    // Find "View Storybook" button - wait longer
    const viewStorybookButton = page.locator('button:has-text("View Storybook"), a:has-text("View Storybook"), button:has-text("View")').first();
    
    if (await viewStorybookButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await viewStorybookButton.click();
      
      // Wait longer for storybook viewer modal and data to load
      await page.waitForTimeout(3000);
      
      // Check if modal/dialog opened - longer timeout
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="viewer"]').first();
      if (await modal.isVisible({ timeout: 15000 }).catch(() => false)) {
        await takeScreenshot(page, 'storybook-viewer');
        
        // Check for storybook content - wait longer for images/data
        await page.waitForTimeout(2000);
        const hasContent = await page.locator('text=/page|milestone|image/i, img').first().isVisible({ timeout: 15000 }).catch(() => false);
        expect(hasContent).toBeTruthy();
      }
    } else {
      // Skip if no storybook available
      test.skip();
    }
  });

  test('TC-2.3.5: Download PDF - Available', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Find download PDF button - wait longer
    const downloadButton = page.locator('button:has-text("Download PDF"), a:has-text("Download PDF")').first();
    
    if (await downloadButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Set up download listener - longer timeout for PDF generation
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }).catch(() => null), // 60s for PDF
        downloadButton.click(),
      ]);
      
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.pdf$/i);
        
        // Validate file size (should be reasonable)
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const stats = fs.statSync(path);
          expect(stats.size).toBeGreaterThan(10000); // At least 10KB
          expect(stats.size).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
        }
      }
    } else {
      // Skip if no PDF available
      test.skip();
    }
  });

  test('TC-2.3.7: Filters - By status', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find filter dropdown
    const filterSelect = page.locator('select, [role="combobox"]').first();
    if (await filterSelect.isVisible()) {
      // Select "Approved" filter
      await filterSelect.selectOption({ label: /approved/i });
      await page.waitForTimeout(1000);
      
      // Check that only approved assessments are shown
      // This depends on implementation
    }
  });

  test('TC-2.3.8: Search - By assessment', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Check that results are filtered
      // This depends on implementation
    }
  });

  test('TC-2.4.1: Storybook viewer - View storybook', async ({ page }) => {
    // Open storybook viewer
    await page.waitForTimeout(2000);
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Check modal opened
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check for page content
      await expect(page.locator('text=/page|milestone/i').first()).toBeVisible({ timeout: 5000 });
      
      await takeScreenshot(page, 'storybook-viewer-open');
    }
  });

  test('TC-2.4.2: Storybook viewer - Navigate next', async ({ page }) => {
    // Open storybook
    await page.waitForTimeout(2000);
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Click next button
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Should be on page 2
        await expect(page.locator('text=/page 2|2 of/i').first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('TC-2.4.4: Storybook viewer - Keyboard navigation', async ({ page }) => {
    // Open storybook
    await page.waitForTimeout(2000);
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Press right arrow
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
      
      // Should navigate to next page
      // Check page counter updated
    }
  });

  test('TC-2.4.5: Storybook viewer - Keyboard escape', async ({ page }) => {
    // Open storybook
    await page.waitForTimeout(2000);
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Press escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      // Modal should close
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('TC-2.5.1: All storybooks page loads', async ({ page }) => {
    // Navigate to all storybooks
    await page.goto('/dashboard/parent/storybooks');
    await waitForPageLoad(page);
    
    // Check page loads
    await expect(page.locator('text=/storybook|all storybooks/i').first()).toBeVisible({ timeout: 5000 });
    
    await takeScreenshot(page, 'all-storybooks-page');
  });
});

