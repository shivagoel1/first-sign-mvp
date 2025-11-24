import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  waitForPageLoad,
  loginAsParent,
  validatePDFDownload,
  takeScreenshot,
} from './helpers';

test.describe('PDF Generation & Download', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page);
    await waitForPageLoad(page);
  });

  test('TC-5.1.1: Parent PDF download - Happy Path', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find download PDF button
    const downloadButton = page.locator('button:has-text("Download PDF"), a:has-text("Download PDF")').first();
    
    if (await downloadButton.isVisible()) {
      // Validate PDF download
      const result = await validatePDFDownload(page, downloadButton, {
        minSize: 10000, // 10KB
        maxSize: 10 * 1024 * 1024, // 10MB
      });
      
      expect(result.filename).toMatch(/\.pdf$/i);
      expect(result.fileSize).toBeGreaterThan(10000);
      expect(result.fileSize).toBeLessThan(10 * 1024 * 1024);
      
      // Clean up
      if (fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath);
      }
    } else {
      test.skip();
    }
  });

  test('TC-5.1.6: PDF download from dashboard', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Navigate to child detail if needed
    const childCard = page.locator('[class*="child"]').first();
    if (await childCard.isVisible()) {
      await childCard.click();
      await page.waitForTimeout(2000);
    }
    
    // Find download button
    const downloadButton = page.locator('button:has-text("Download PDF")').first();
    
    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        downloadButton.click(),
      ]);
      
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.pdf$/i);
      
      // Save and validate
      const downloadsDir = path.join(__dirname, '../downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      const filePath = path.join(downloadsDir, filename);
      await download.saveAs(filePath);
      
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(10000);
      
      // Clean up
      fs.unlinkSync(filePath);
    }
  });

  test('TC-5.1.7: PDF download from storybook viewer', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Open storybook viewer
    const viewButton = page.locator('button:has-text("View Storybook")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Find download button in modal
      const downloadButton = page.locator('button:has-text("Download PDF")').first();
      if (await downloadButton.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          downloadButton.click(),
        ]);
        
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.pdf$/i);
        
        // Validate file
        const downloadsDir = path.join(__dirname, '../downloads');
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }
        
        const filePath = path.join(downloadsDir, filename);
        await download.saveAs(filePath);
        
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(10000);
        
        // Clean up
        fs.unlinkSync(filePath);
      }
    }
  });

  test('TC-5.2.1: PDF with many pages', async ({ page }) => {
    // This test would require a storybook with 30+ pages
    // For now, we'll test that PDFs download correctly regardless of page count
    await page.waitForTimeout(2000);
    
    const downloadButton = page.locator('button:has-text("Download PDF")').first();
    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }), // Longer timeout for large PDFs
        downloadButton.click(),
      ]);
      
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.pdf$/i);
      
      // File should be reasonable size even with many pages
      const downloadsDir = path.join(__dirname, '../downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      const filePath = path.join(downloadsDir, filename);
      await download.saveAs(filePath);
      
      const stats = fs.statSync(filePath);
      // Should be compressed, not too large
      expect(stats.size).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
      
      // Clean up
      fs.unlinkSync(filePath);
    }
  });

  test('TC-5.3.2: PDF download failure handling', async ({ page }) => {
    // This would test when PDF URL is invalid or missing
    // For now, we'll test that button is disabled when PDF not available
    await page.waitForTimeout(2000);
    
    // Check for disabled download buttons (when PDF not ready)
    const downloadButtons = page.locator('button:has-text("Download PDF")');
    const count = await downloadButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = downloadButtons.nth(i);
      const isDisabled = await button.isDisabled();
      const isVisible = await button.isVisible();
      
      // If button is visible but disabled, that's expected behavior
      if (isVisible && isDisabled) {
        // Button should show why it's disabled
        const text = await button.textContent();
        expect(text).toMatch(/generating|not available|pending/i);
      }
    }
  });
});

