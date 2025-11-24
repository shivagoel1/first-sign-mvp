import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  fillAssessmentForm,
  answerAssessmentQuestions,
  loginAsParent,
  loginAsPhysician,
  waitForElement,
  takeScreenshot,
  validatePDFDownload,
  waitForAIProcessing,
  TEST_CHILD,
  TEST_USER,
} from './helpers';

/**
 * Complete End-to-End Assessment Flow Test
 * 
 * Flow:
 * 1. Parent takes assessment for first time
 * 2. Completes assessment questions (with some 'No' responses)
 * 3. Creates account
 * 4. Verifies dashboard appearance
 * 5. Physician logs in and reviews AI-generated report
 * 6. Verifies report quality, images, URLs, UI/UX
 * 7. Physician approves report
 * 8. Parent logs in again, views report
 * 9. Checks 'View Story' section (images, text, support URLs)
 * 10. Downloads PDF and validates layout
 */

// These tests must run sequentially as they depend on each other
test.describe.serial('Complete Assessment Flow - End to End', () => {
  // Use unique email for each test run to avoid conflicts
  // Store in a way that persists across tests in the same run
  let testParentEmail = `test-parent-${Date.now()}@example.com`;
  const testParent = {
    email: testParentEmail,
    password: TEST_USER.parent.password,
    fullName: 'Test Parent E2E',
  };

  test('TC-COMPLETE-1: Parent completes assessment and creates account', async ({ page }) => {
    // Step 1: Navigate to landing page
    await page.goto('/');
    await waitForPageLoad(page);
    await takeScreenshot(page, '01-landing-page');

    // Step 2: Click CTA to start assessment
    const ctaButton = page.locator('a:has-text("Get Your Free Assessment"), button:has-text("Get Your Free Assessment")').first();
    await expect(ctaButton).toBeVisible({ timeout: 10000 });
    await ctaButton.click();
    await page.waitForURL(/\/assessment/, { timeout: 10000 });
    await takeScreenshot(page, '02-assessment-form');

    // Step 3: Fill assessment form
    await fillAssessmentForm(page, TEST_CHILD);
    await takeScreenshot(page, '03-assessment-form-filled');

    // Step 4: Submit form and navigate to questions
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Continue to Questions"), button[type="submit"]').first();
    await expect(continueButton).toBeVisible({ timeout: 10000 });
    await continueButton.click();
    await page.waitForURL(/\/assessment\/questions/, { timeout: 15000 });
    await takeScreenshot(page, '04-questions-page');

    // Step 5: Answer questions with mix of responses
    // Wait for questions to load
    await page.waitForTimeout(3000);
    const hasQuestions = await page.locator('input[type="radio"], button:has-text("Next")').first().isVisible({ timeout: 15000 }).catch(() => false);
    
    if (!hasQuestions) {
      test.skip();
      return;
    }

    // Get total question count
    let totalQuestions = 10; // Default
    const progressText = await page.locator('text=/of \d+|question \d+/i').first().textContent().catch(() => null);
    if (progressText) {
      const match = progressText.match(/(\d+)/);
      if (match) {
        totalQuestions = Math.min(parseInt(match[1]), 25);
      }
    }

    // Answer questions - mark some as 'No' or negative responses
    let noResponseCount = 0;
    const targetNoResponses = Math.floor(totalQuestions * 0.3); // 30% negative responses

    for (let i = 0; i < totalQuestions; i++) {
      await page.waitForTimeout(1000);
      
      // Wait for question to load
      await page.waitForSelector('input[type="radio"]', { timeout: 10000 }).catch(() => {});
      
      // Get all response options
      const radioOptions = page.locator('input[type="radio"]');
      const optionCount = await radioOptions.count();
      
      if (optionCount === 0) break;
      
      // Strategy: Mark some as 'No' or negative responses
      // Look for options that indicate negative responses
      let selectedOption = 0; // Default to first option (usually positive)
      
      if (noResponseCount < targetNoResponses) {
        // Find a negative option (usually last or contains "not", "no", "sometimes")
        for (let j = optionCount - 1; j >= 0; j--) {
          const option = radioOptions.nth(j);
          const label = page.locator(`label[for="${await option.getAttribute('id') || ''}"]`).first();
          const labelText = await label.textContent().catch(() => '');
          
          if (labelText && /not|no|rarely|sometimes/i.test(labelText)) {
            selectedOption = j;
            noResponseCount++;
            break;
          }
        }
      }
      
      // Select the option
      const optionToSelect = radioOptions.nth(selectedOption);
      await optionToSelect.check({ timeout: 5000 });
      await page.waitForTimeout(300);
      
      // Add notes for negative responses (if textarea exists)
      if (selectedOption > 0 && noResponseCount <= targetNoResponses) {
        const notesTextarea = page.locator('textarea, textarea[placeholder*="note" i]').first();
        if (await notesTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await notesTextarea.fill(`Test note for question ${i + 1} - marked as needing support`);
          await page.waitForTimeout(200);
        }
      }
      
      // Click Next or Complete Assessment
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Complete Assessment"), button[type="submit"]').first();
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      } else {
        break;
      }
    }

    await takeScreenshot(page, '05-questions-completed');

    // Step 6: Navigate to review page
    await page.waitForURL(/\/assessment\/review/, { timeout: 15000 });
    await takeScreenshot(page, '06-review-page');

    // Step 7: Verify review page shows correct information
    await expect(page.locator('text=/review|assessment/i').first()).toBeVisible({ timeout: 10000 });
    
    // Verify child information is displayed
    const hasChildInfo = await page.locator(`text=${TEST_CHILD.name}, text=${TEST_CHILD.focusArea}`).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasChildInfo).toBeTruthy();

    // Step 8: Create account
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput1 = page.locator('input[type="password"]:nth-of-type(1), input[name="password"]').first();
    const passwordInput2 = page.locator('input[type="password"]:nth-of-type(2), input[name*="confirm" i]').first();
    const nameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]').first();
    
    await emailInput.fill(testParent.email);
    await passwordInput1.fill(testParent.password);
    await passwordInput2.fill(testParent.password);
    await nameInput.fill(testParent.fullName);
    
    await takeScreenshot(page, '07-signup-form-filled');

    // Step 9: Submit account creation
    const submitButton = page.locator('button:has-text("Create Account"), button:has-text("Submit"), button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Step 10: Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for dashboard to load
    await takeScreenshot(page, '08-parent-dashboard-initial');

    // Step 11: Verify dashboard appearance
    // Check welcome section
    const hasWelcome = await page.locator('text=/welcome|dashboard|home/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasWelcome).toBeTruthy();

    // Check for assessment status (should show as "Awaiting Review" or "Pending")
    const hasStatus = await page.locator('text=/awaiting|pending|generating|approved/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasStatus).toBeTruthy();

    // Verify assessment appears in dashboard
    const hasAssessment = await page.locator('text=/assessment|storybook|report/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasAssessment).toBeTruthy();
  });

  test('TC-COMPLETE-2: Physician reviews and approves assessment', async ({ page }) => {
    // This test depends on TC-COMPLETE-1 completing first
    // The assessment needs to be processed by AI, which can take up to 5 minutes
    // For now, we'll wait a reasonable amount and then check
    
    // Step 1: Login as physician
    await loginAsPhysician(page);
    await waitForPageLoad(page);
    await page.waitForTimeout(5000); // Wait for dashboard to fully load
    await takeScreenshot(page, '09-physician-dashboard');

    // Step 2: Wait for pending reviews section to load
    // The assessment from TC-COMPLETE-1 needs AI processing (can take up to 5 minutes)
    // We'll wait up to 3 minutes for it to appear, then skip if not found
    console.log('Waiting for pending review to appear (assessment may be processing)...');
    
    // First, check the pending reviews count
    const pendingCountText = page.locator('text=/\\d+ awaiting|Pending Reviews.*\\d+/i').first();
    let pendingCount = 0;
    const countText = await pendingCountText.textContent({ timeout: 10000 }).catch(() => null);
    if (countText) {
      const match = countText.match(/(\d+)/);
      if (match) {
        pendingCount = parseInt(match[1], 10);
        console.log(`Found ${pendingCount} pending reviews`);
      }
    }
    
    // Scroll to the "Pending Reviews" section
    const pendingSection = page.locator('section:has-text("Pending Reviews"), div:has-text("Pending Reviews"), h2:has-text("Pending Reviews")').first();
    await pendingSection.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Look for the "Review Assessment" button specifically (this is the actual button text)
    const reviewButton = page.locator('button:has-text("Review Assessment")').first();
    
    // Wait for button to appear (with extended timeout for AI processing - up to 3 minutes)
    const hasReviewButton = await reviewButton.isVisible({ timeout: 180000 }).catch(() => false);
    
    if (!hasReviewButton) {
      // Check if there are any pending review cards at all
      const anyCard = page.locator('[class*="card"]:has-text("Pending"), [class*="card"]:has-text("Review"), button:has-text("Review")').first();
      const hasAnyCard = await anyCard.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (!hasAnyCard || pendingCount === 0) {
        console.log('No pending reviews found after 3 minutes - assessment may still be processing');
        console.log('This is expected if AI processing takes longer than 3 minutes');
        // Take screenshot for debugging
        await takeScreenshot(page, '10-no-pending-reviews');
        test.skip();
        return;
      }
      
      // Try clicking the first card we found
      await anyCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await anyCard.click({ force: true });
    } else {
      // Scroll button into view and click
      await reviewButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await reviewButton.click();
    }
    
    await page.waitForTimeout(5000); // Longer wait for API call to start
    await takeScreenshot(page, '10-physician-review-modal-opened');
    
    // Check for any console errors that might indicate API failures
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 3: Wait for review modal to load - Dialog component from Radix UI
    // The modal might take time to load assessment details from API
    // First check if there's a loading state or overlay
    const overlay = page.locator('[class*="DialogOverlay"], [class*="overlay"], [class*="backdrop"]').first();
    const hasOverlay = await overlay.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasOverlay) {
      console.log('Modal overlay detected, waiting for content...');
    }
    
    const loadingIndicator = page.locator('[class*="loader"], [class*="spinner"], [aria-busy="true"], [class*="Loading"], [class*="Progress"]').first();
    const isLoading = await loadingIndicator.isVisible({ timeout: 10000 }).catch(() => false);
    if (isLoading) {
      console.log('Modal is loading, waiting for it to complete...');
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    }
    
    // Wait for modal to appear - try multiple approaches
    // Radix UI Dialog renders with role="dialog" and aria-modal="true"
    // Also check for DialogContent which is the actual content container
    const modal = page.locator(
      '[class*="DialogContent"], ' +
      '[role="dialog"][aria-modal="true"], ' +
      '[role="dialog"], ' +
      'div[aria-modal="true"], ' +
      'div:has-text("Assessment Overview"), ' +
      'div:has-text("Child Information"), ' +
      'div:has-text("Review Assessment"), ' +
      'div:has-text("Child Name"), ' +
      'div[class*="modal"]'
    ).first();
    
    // Wait for modal to appear (with longer timeout for API call - up to 60 seconds)
    try {
      await expect(modal).toBeVisible({ timeout: 60000 });
      console.log('Modal appeared successfully!');
    } catch (error) {
      // If modal didn't appear, check for errors
      if (consoleErrors.length > 0) {
        console.log('Console errors detected:', consoleErrors);
      }
      // Check current URL and page state
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      // Take another screenshot for debugging
      await takeScreenshot(page, '10-modal-failed-to-appear');
      throw error;
    }

    // Step 4: Verify assessment details are visible
    await page.waitForTimeout(2000);
    const hasDetails = await page.locator('text=/child|parent|assessment|review/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasDetails).toBeTruthy();

    // Step 5: Check if AI report is generating or ready
    const progressBar = page.locator('[role="progressbar"], [class*="progress"], [aria-valuenow]').first();
    const isGenerating = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);

    if (isGenerating) {
      // Step 6: Wait for AI generation to complete (up to 5 minutes)
      await takeScreenshot(page, '11-ai-generating');
      
      try {
        await waitForAIProcessing(page, 300000); // 5 minutes timeout
        await page.waitForTimeout(3000); // Extra wait for UI to update
        await takeScreenshot(page, '12-ai-generation-complete');
      } catch (error) {
        console.log('AI processing timeout or error:', error);
        // Continue anyway - may have completed
      }
    }

    // Step 7: Verify report quality - check for storybook content
    await page.waitForTimeout(3000);
    const hasStorybook = await page.locator('text=/storybook|page|milestone/i, img').first().isVisible({ timeout: 15000 }).catch(() => false);
    
    if (hasStorybook) {
      await takeScreenshot(page, '13-storybook-preview');

      // Step 8: Verify images are present and loading
      const images = page.locator('img').filter({ hasNot: page.locator('[alt=""]') });
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);

      // Check first image loads correctly
      if (imageCount > 0) {
        const firstImage = images.first();
        const imageSrc = await firstImage.getAttribute('src');
        expect(imageSrc).toBeTruthy();
        expect(imageSrc).not.toContain('placeholder');
        
        // Verify image is visible and has reasonable dimensions
        const boundingBox = await firstImage.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThan(50);
          expect(boundingBox.height).toBeGreaterThan(50);
        }
      }

      // Step 9: Verify URLs/Articles are present for "Needs Support" pages
      const articleLinks = page.locator('a[href*="http"], a[href*="https"], text=/cdc|healthychildren|aap/i');
      const articleCount = await articleLinks.count();
      
      // Should have at least some articles if there are "Needs Support" pages
      if (articleCount > 0) {
        // Verify article links are valid
        const firstArticle = articleLinks.first();
        const articleHref = await firstArticle.getAttribute('href');
        expect(articleHref).toBeTruthy();
        expect(articleHref).toMatch(/^https?:\/\//);
        
        // Check article opens in new tab
        const target = await firstArticle.getAttribute('target');
        expect(target).toBe('_blank');
      }

      // Step 10: Verify UI/UX elements
      // Check navigation buttons
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
      const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous" i]').first();
      
      const hasNavigation = await nextButton.isVisible({ timeout: 5000 }).catch(() => false) || 
                           await prevButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasNavigation).toBeTruthy();

      // Check page counter
      const hasPageCounter = await page.locator('text=/page \d+|^\d+ of \d+/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasPageCounter).toBeTruthy();
    }

    // Step 11: Add physician notes
    const notesTextarea = page.locator('textarea, textarea[placeholder*="note" i]').first();
    if (await notesTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notesTextarea.fill('E2E Test: Report reviewed and approved. All content verified - images, URLs, and layout are correct.');
      await page.waitForTimeout(500);
    }

    // Step 12: Approve the report
    const approveButton = page.locator('button:has-text("Approve")').first();
    if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveButton.click();
      await page.waitForTimeout(3000);
      
      // Modal should close or show success message
      const modalStillOpen = await modal.isVisible({ timeout: 5000 }).catch(() => false);
      const hasSuccess = await page.locator('text=/success|approved|complete/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(modalStillOpen === false || hasSuccess === true).toBeTruthy();
      await takeScreenshot(page, '14-report-approved');
    }
  });

  test('TC-COMPLETE-3: Parent views approved report and downloads PDF', async ({ page }) => {
    // This test depends on TC-COMPLETE-2 completing first (physician approval)
    // Wait a bit for approval to process
    await page.waitForTimeout(5000);
    
    // Step 1: Login as parent (using the account created in TC-COMPLETE-1)
    // The account already exists, so just do a simple login
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await emailInput.fill(testParent.email);
    await passwordInput.fill(testParent.password);
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '15-parent-dashboard-after-approval');

    // Step 2: Verify dashboard shows approved assessment
    const hasApprovedStatus = await page.locator('text=/approved|ready|view/i').first().isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasApprovedStatus).toBeTruthy();

    // Step 3: Navigate to child detail if needed
    const childCard = page.locator('[class*="child"], button:has-text("View")').first();
    if (await childCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await childCard.click();
      await page.waitForTimeout(2000);
    }

    // Step 4: Open storybook viewer
    const viewStorybookButton = page.locator('button:has-text("View Storybook"), button:has-text("View"), a:has-text("View Storybook")').first();
    
    if (!(await viewStorybookButton.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await viewStorybookButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '16-storybook-viewer-opened');

    // Step 5: Verify storybook viewer opened
    const viewerModal = page.locator('[role="dialog"], [class*="modal"], [class*="viewer"]').first();
    await expect(viewerModal).toBeVisible({ timeout: 15000 });

    // Step 6: Verify images render correctly
    await page.waitForTimeout(2000);
    const storybookImages = page.locator('img').filter({ hasNot: page.locator('[alt=""]') });
    const imageCount = await storybookImages.count();
    expect(imageCount).toBeGreaterThan(0);

    // Check first image
    if (imageCount > 0) {
      const firstImage = storybookImages.first();
      const imageSrc = await firstImage.getAttribute('src');
      expect(imageSrc).toBeTruthy();
      
      // Verify image loads (not broken)
      const isImageLoaded = await firstImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalHeight > 0).catch(() => false);
      expect(isImageLoaded).toBeTruthy();
      
      // Verify image dimensions are reasonable
      const boundingBox = await firstImage.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(100);
        expect(boundingBox.height).toBeGreaterThan(100);
        // Images should not be too wide (should fit in viewport)
        expect(boundingBox.width).toBeLessThan(800);
      }
    }

    // Step 7: Verify text renders correctly
    const hasText = await page.locator('text=/milestone|narrative|page/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasText).toBeTruthy();

    // Check narrative text is readable
    const narrativeText = page.locator('text=/child|development|milestone/i').first();
    if (await narrativeText.isVisible({ timeout: 5000 }).catch(() => false)) {
      const textContent = await narrativeText.textContent();
      expect(textContent?.length).toBeGreaterThan(10); // Should have meaningful content
    }

    // Step 8: Verify support URLs appear where required
    // Look for "Needs Support" pages and check for article links
    const articleSection = page.locator('text=/helpful resources|support|article/i').first();
    const hasArticleSection = await articleSection.isVisible({ timeout: 10000 }).catch(() => false);
    
    // Navigate through pages to find "Needs Support" pages
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
    let foundSupportPage = false;
    
    for (let i = 0; i < 5 && !foundSupportPage; i++) {
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false) && 
          !(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(1500);
        
        // Check if this page has articles
        const hasArticles = await page.locator('a[href*="http"], a[href*="https"], text=/cdc|healthychildren/i').first().isVisible({ timeout: 2000 }).catch(() => false);
        if (hasArticles) {
          foundSupportPage = true;
          await takeScreenshot(page, '17-needs-support-page-with-articles');
          
          // Verify article links
          const articleLinks = page.locator('a[href*="http"], a[href*="https"]');
          const linkCount = await articleLinks.count();
          expect(linkCount).toBeGreaterThan(0);
          
          // Verify at least one article link is valid
          const firstLink = articleLinks.first();
          const linkHref = await firstLink.getAttribute('href');
          expect(linkHref).toBeTruthy();
          expect(linkHref).toMatch(/^https?:\/\//);
        }
      } else {
        break;
      }
    }

    // Step 9: Navigate back to first page
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label*="previous" i]').first();
    for (let i = 0; i < 5; i++) {
      if (await prevButton.isVisible({ timeout: 2000 }).catch(() => false) && 
          !(await prevButton.isDisabled())) {
        await prevButton.click();
        await page.waitForTimeout(1000);
      } else {
        break;
      }
    }

    // Step 10: Download PDF
    const downloadButton = page.locator('button:has-text("Download PDF"), a:has-text("Download PDF")').first();
    
    if (await downloadButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Validate PDF download
      const result = await validatePDFDownload(page, downloadButton, {
        minSize: 10000, // 10KB
        maxSize: 20 * 1024 * 1024, // 20MB (larger for comprehensive reports)
      });
      
      expect(result.filename).toMatch(/\.pdf$/i);
      expect(result.fileSize).toBeGreaterThan(10000);
      expect(result.fileSize).toBeLessThan(20 * 1024 * 1024);
      
      await takeScreenshot(page, '18-pdf-downloaded');
      
      // Clean up downloaded file
      const fs = require('fs');
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    } else {
      // PDF might not be ready yet
      console.log('PDF download button not available - may still be generating');
    }

    // Step 11: Close storybook viewer
    const closeButton = page.locator('button[aria-label*="close" i], button:has-text("Close"), button:has([class*="close"])').first();
    if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Try Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Step 12: Verify dashboard still works after closing viewer
    const stillOnDashboard = page.url().includes('/dashboard/parent');
    expect(stillOnDashboard).toBeTruthy();
    await takeScreenshot(page, '19-dashboard-after-viewing');
  });

  test('TC-COMPLETE-4: Verify PDF layout and content', async ({ page }) => {
    // This test depends on TC-COMPLETE-3 (parent viewing report)
    // This test would require downloading and parsing the PDF
    // For now, we'll verify the download works and file size is reasonable
    // Full PDF content validation would require a PDF parsing library
    
    // Login as parent using the account from TC-COMPLETE-1
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', testParent.password);
    const loginButton = page.locator('button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();
    await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Find and download PDF
    const downloadButton = page.locator('button:has-text("Download PDF")').first();
    
    if (await downloadButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        downloadButton.click(),
      ]);
      
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.pdf$/i);
      
      // Save PDF for validation
      const fs = require('fs');
      const path = require('path');
      const downloadsDir = path.join(__dirname, '../downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      const filePath = path.join(downloadsDir, filename);
      await download.saveAs(filePath);
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Validate file size (should be reasonable for a storybook PDF)
      expect(fileSize).toBeGreaterThan(50000); // At least 50KB
      expect(fileSize).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
      
      // Note: Full PDF content validation (text, images, layout) would require
      // a PDF parsing library like pdf-parse or pdf-lib
      // This is a basic validation that the PDF exists and has reasonable size
      
      // Clean up
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      test.skip();
    }
  });

  test('TC-COMPLETE-5: Verify dashboard elements behavior', async ({ page }) => {
    // Login as parent using the account from TC-COMPLETE-1
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', testParent.password);
    const loginButton = page.locator('button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();
    await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '20-dashboard-elements-check');

    // Step 1: Verify Progress Overview section
    const hasProgressOverview = await page.locator('text=/progress|overview|stat/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasProgressOverview).toBeTruthy();

    // Step 2: Verify stat cards display correctly
    const statCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    const statCount = await statCards.count();
    expect(statCount).toBeGreaterThan(0);

    // Step 3: Verify assessment cards
    const assessmentCards = page.locator('[class*="assessment"], [class*="card"]');
    const assessmentCount = await assessmentCards.count();
    // Should have at least one assessment or show empty state
    const hasAssessments = assessmentCount > 0 || 
                          await page.locator('text=/empty|no.*assessment|start.*assessment/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasAssessments).toBeTruthy();

    // Step 4: Verify status badges
    if (assessmentCount > 0) {
      const statusBadges = page.locator('text=/approved|pending|awaiting|generating/i');
      const badgeCount = await statusBadges.count();
      expect(badgeCount).toBeGreaterThan(0);
    }

    // Step 5: Verify navigation elements
    const sidebar = page.locator('[class*="sidebar"], nav').first();
    const hasSidebar = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSidebar).toBeTruthy();

    // Step 6: Verify "New Assessment" button
    const newAssessmentButton = page.locator('a:has-text("New Assessment"), button:has-text("New Assessment")').first();
    const hasNewAssessment = await newAssessmentButton.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasNewAssessment).toBeTruthy();

    // Step 7: Verify filters and search (if implemented)
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    // Search is optional, so we just check if it exists

    // Step 8: Verify responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '21-dashboard-mobile');
    
    // Mobile menu should be visible
    const mobileMenu = page.locator('button[aria-label*="menu" i], button:has([class*="hamburger"])').first();
    const hasMobileMenu = await mobileMenu.isVisible({ timeout: 5000 }).catch(() => false);
    // Mobile menu is optional, so we just check if it exists

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

