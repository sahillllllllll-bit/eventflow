import puppeteer from 'puppeteer';

/**
 * Converts an HTML string into a PDF Buffer using Puppeteer (headless Chrome).
 * Works on Windows (local) and Render/Linux (production) — no system install needed.
 *
 * @param {string} html - Full HTML string
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
export const generatePDFFromHTML = async (html) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',   // required on Render free tier
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Load HTML directly — base64 images in <img src="data:..."> render fine
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,   // renders background colors/gradients
      margin: {
        top:    '10mm',
        bottom: '10mm',
        left:   '10mm',
        right:  '10mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[TicketPDF] Puppeteer error:', error.message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};