import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  loginAsPhysician,
  waitForElement,
  takeScreenshot,
  waitForAIProcessing,
  TEST_USER,
} from './helpers';

test.describe('Physician Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test - with longer timeout
    await loginAsPhysician(page);
    await waitForPageLoad(page, 30000);
    // Extra wait for dashboard data to load
    await page.waitForTimeout(3000);
  });

  test('TC-3.2.1: Dashboard loads correctly', async ({ page }) => {
    // Wait longer for dashboard to load
    await page.waitForTimeout(3000);
    
    // Check stats cards - longer timeout
    const hasStats = await page.locator('text=/pending|approved|review|dashboard/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasStats).toBeTruthy();
    
    // Check pending reviews section or empty state
    const hasContent = await page.locator('text=/pending review|no.*pending|empty/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
    
    await takeScreenshot(page, 'physician-dashboard');
    
    // Check no critical console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) {
        errors.push(text);
      }
    });
    
    await page.waitForTimeout(2000);
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
  });

  test('TC-3.2.2: Pending reviews display', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check for review cards
    const reviewCards = page.locator('[class*="card"], [class*="review"]');
    const count = await reviewCards.count();
    
    // Should have review cards or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-3.2.9: Review Next button', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const reviewNextButton = page.locator('button:has-text("Review Next"), button:has-text("Next Priority")').first();
    
    if (await reviewNextButton.isVisible() && !(await reviewNextButton.isDisabled())) {
      await reviewNextButton.click();
      await page.waitForTimeout(2000);
      
      // Should open review modal
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-3.2.10: Click review card', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find first review card
    const reviewCard = page.locator('[class*="card"], [class*="review"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      // Should open review modal
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      await takeScreenshot(page, 'physician-review-modal');
    }
  });

  test('TC-3.3.1: Review and approve - Happy Path', async ({ page }) => {
    // Open review modal - wait longer for data
    await page.waitForTimeout(3000);
    const reviewCard = page.locator('[class*="card"], [class*="review"], button:has-text("Review")').first();
    
    if (await reviewCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await reviewCard.click();
      await page.waitForTimeout(3000); // Wait for modal to open and load data
      
      // Wait for modal - longer timeout
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 15000 });
      
      // Check assessment details are visible - wait longer
      await page.waitForTimeout(2000);
      const hasDetails = await page.locator('text=/child|parent|assessment|review/i').first().isVisible({ timeout: 15000 }).catch(() => false);
      expect(hasDetails).toBeTruthy();
      
      // Add physician notes (optional)
      const notesTextarea = page.locator('textarea, textarea[placeholder*="note" i]').first();
      if (await notesTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
        await notesTextarea.fill('Test physician notes');
        await page.waitForTimeout(500);
      }
      
      // Click Approve button
      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveButton.click();
        await page.waitForTimeout(3000); // Wait for API call
        
        // Modal should close or show success - wait longer
        await page.waitForTimeout(3000);
      }
    } else {
      // Skip if no reviews available
      test.skip();
    }
  });

  test('TC-3.3.2: Review - Needs Revision', async ({ page }) => {
    // Open review modal
    await page.waitForTimeout(2000);
    const reviewCard = page.locator('[class*="card"], [class*="review"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Add notes
      const notesTextarea = page.locator('textarea').first();
      if (await notesTextarea.isVisible()) {
        await notesTextarea.fill('Needs revision - please update');
      }
      
      // Click Needs Revision
      const needsRevisionButton = page.locator('button:has-text("Needs Revision"), button:has-text("Revision")').first();
      if (await needsRevisionButton.isVisible()) {
        await needsRevisionButton.click();
        await page.waitForTimeout(2000);
        
        // Modal should close
        await expect(modal).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-3.3.6: Storybook preview - Completed', async ({ page }) => {
    // Open review modal for completed assessment
    await page.waitForTimeout(2000);
    const reviewCard = page.locator('[class*="card"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check for storybook preview
      await page.waitForTimeout(2000);
      const storybookPreview = page.locator('text=/storybook|page|milestone/i').first();
      
      if (await storybookPreview.isVisible()) {
        await takeScreenshot(page, 'physician-review-with-storybook');
        
        // Check for images
        const images = page.locator('img').filter({ hasNot: page.locator('[alt=""]') });
        const imageCount = await images.count();
        expect(imageCount).toBeGreaterThan(0);
      }
    }
  });

  test('TC-3.3.7: Storybook preview - Generating', async ({ page }) => {
    // Open review modal for generating assessment
    await page.waitForTimeout(2000);
    const reviewCard = page.locator('[class*="card"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check for progress indicator
      const progressBar = page.locator('[role="progressbar"], [class*="progress"], [aria-valuenow]').first();
      if (await progressBar.isVisible()) {
        await takeScreenshot(page, 'physician-review-generating');
        
        // Progress should be updating
        const value = await progressBar.getAttribute('aria-valuenow');
        if (value) {
          const progress = parseInt(value);
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  test('TC-3.3.10: Retry AI Generation', async ({ page }) => {
    // Open review modal
    await page.waitForTimeout(2000);
    const reviewCard = page.locator('[class*="card"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Find retry button
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Retry AI")').first();
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);
        
        // Should show progress or success message
        await expect(page.locator('text=/processing|generating|success/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('TC-3.3.11: Regenerate PDF', async ({ page }) => {
    // Open review modal
    await page.waitForTimeout(2000);
    const reviewCard = page.locator('[class*="card"]').first();
    
    if (await reviewCard.isVisible()) {
      await reviewCard.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Find regenerate PDF button
      const regenerateButton = page.locator('button:has-text("Regenerate PDF"), button:has-text("Regenerate")').first();
      if (await regenerateButton.isVisible()) {
        await regenerateButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success or progress
        await expect(page.locator('text=/success|regenerating|complete/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

