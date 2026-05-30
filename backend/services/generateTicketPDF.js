import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

/**
 * Converts an HTML string into a PDF Buffer.
 * Uses @sparticuz/chromium + puppeteer-core — works on Render free tier,
 * serverless, and Windows/Mac locally.
 *
 * @param {string} html - Full HTML string
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
export const generatePDFFromHTML = async (html) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    // Load HTML directly — base64 images render fine
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: {
        top:    '10mm',
        bottom: '10mm',
        left:   '10mm',
        right:  '10mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[TicketPDF] Error:', error.message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};