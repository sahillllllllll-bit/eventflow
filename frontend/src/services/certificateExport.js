/**
 * Production Certificate Export Service
 *
 * Strategy:
 *  - Renders the live React canvas element using html2canvas
 *  - Supports single PNG / JPG download
 *  - Supports bulk multi-page PDF (one certificate per page, same size)
 *  - No element ID needed — pass the DOM ref directly OR let it auto-find
 *
 * Dependencies (already in most Vite+React setups):
 *   npm install html2canvas jspdf
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Capture a DOM element to an HTMLCanvasElement.
 * @param {HTMLElement} element
 * @param {number} scale  — 2 = retina quality, 3 = print quality
 */
async function captureElement(element, scale = 2) {
  if (!element) throw new Error('No element to capture');

  return html2canvas(element, {
    scale,
    useCORS: true,           // allow cross-origin images (logos, etc.)
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    // Make sure the full element is captured, even if scrolled
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });
}

/**
 * Trigger a browser file download from a data URL.
 */
function downloadDataURL(dataURL, filename) {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Find the certificate canvas element.
 * First tries the provided ref, then falls back to a DOM query.
 * @param {React.RefObject|HTMLElement|null} refOrElement
 */
function resolveElement(refOrElement) {
  if (!refOrElement) {
    // Auto-discover: look for the canvas container rendered by Canvas.jsx
    const el = document.querySelector('[data-certificate-canvas]');
    if (!el) throw new Error('Certificate canvas element not found. Make sure data-certificate-canvas attribute is set.');
    return el;
  }
  // React ref
  if (refOrElement.current) return refOrElement.current;
  // Raw DOM element
  if (refOrElement instanceof HTMLElement) return refOrElement;
  throw new Error('Invalid element reference');
}

// ─── Single Certificate Exports ─────────────────────────────────────────────

export const exportCertificate = {
  /**
   * Export the visible certificate canvas as PNG.
   * @param {React.RefObject|HTMLElement|null} elementRef
   * @param {string} filename
   */
  async toPNG(elementRef, filename = 'certificate.png') {
    try {
      const element = resolveElement(elementRef);
      const canvas = await captureElement(element, 2);
      downloadDataURL(canvas.toDataURL('image/png'), filename);
      return { success: true };
    } catch (error) {
      console.error('PNG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export the visible certificate canvas as JPG.
   * @param {React.RefObject|HTMLElement|null} elementRef
   * @param {string} filename
   * @param {number} quality  0–1
   */
  async toJPG(elementRef, filename = 'certificate.jpg', quality = 0.95) {
    try {
      const element = resolveElement(elementRef);
      const canvas = await captureElement(element, 2);
      downloadDataURL(canvas.toDataURL('image/jpeg', quality), filename);
      return { success: true };
    } catch (error) {
      console.error('JPG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export as PDF (single certificate).
   * The PDF page is sized exactly to the certificate — no cropping.
   * @param {React.RefObject|HTMLElement|null} elementRef
   * @param {string} filename
   */
  async toPDF(elementRef, filename = 'certificate.pdf') {
    try {
      const element = resolveElement(elementRef);
      const canvas = await captureElement(element, 2);

      const pxW = canvas.width;
      const pxH = canvas.height;

      // Convert px → mm at 96dpi: 1px = 0.264583 mm
      const mmW = (pxW / 2) * 0.264583; // divide by scale
      const mmH = (pxH / 2) * 0.264583;

      const pdf = new jsPDF({
        orientation: mmW >= mmH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmW, mmH], // exact certificate size — no white borders
      });

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0, 0,
        mmW, mmH,
        undefined,
        'FAST'
      );

      pdf.save(filename);
      return { success: true };
    } catch (error) {
      console.error('PDF export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export as high-resolution PNG for printing (300 DPI).
   * @param {React.RefObject|HTMLElement|null} elementRef
   * @param {string} filename
   * @param {number} dpi
   */
  async toPrintPNG(elementRef, filename = 'certificate-print.png', dpi = 300) {
    try {
      const element = resolveElement(elementRef);
      const scale = dpi / 96;
      const canvas = await captureElement(element, scale);
      downloadDataURL(canvas.toDataURL('image/png'), filename);
      return { success: true };
    } catch (error) {
      console.error('Print PNG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get certificate as base64 data URL (used internally for bulk export).
   * @param {React.RefObject|HTMLElement|null} elementRef
   * @param {'png'|'jpg'} format
   * @param {number} scale
   */
  async toDataURL(elementRef, format = 'png', scale = 2) {
    const element = resolveElement(elementRef);
    const canvas = await captureElement(element, scale);
    if (format === 'jpg' || format === 'jpeg') {
      return { dataURL: canvas.toDataURL('image/jpeg', 0.95), width: canvas.width, height: canvas.height };
    }
    return { dataURL: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  },
};

// ─── Bulk Export (multiple recipients → one PDF) ────────────────────────────

/**
 * Generate all certificates for a list of recipients and combine into
 * a single PDF — one page per recipient, all the same size.
 *
 * How it works:
 *   1. For each recipient, temporarily render a hidden certificate element
 *      into the DOM using the provided renderFn.
 *   2. Capture it with html2canvas.
 *   3. Add to the multi-page PDF.
 *   4. Remove the hidden element.
 *   5. Save the PDF.
 *
 * @param {Object[]} recipients         — array of { name, email, ... }
 * @param {Object}   templateData       — the saved template (elements + designConfig)
 * @param {Function} renderCertificate  — (recipient, container) => renders the cert into container
 * @param {Object}   options
 * @param {string}   options.filename
 * @param {'png'|'jpg'} options.imageFormat
 * @param {number}   options.scale
 * @param {Function} options.onProgress — (done, total) => void
 */
export async function exportBulkPDF(recipients, templateData, renderCertificate, options = {}) {
  const {
    filename = 'certificates.pdf',
    imageFormat = 'png',
    scale = 2,
    onProgress = null,
  } = options;

  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients provided');
  }

  // Hidden container — rendered off-screen so it doesn't flash on screen
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  `;
  document.body.appendChild(container);

  let pdf = null;
  let mmW = 0, mmH = 0;

  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      // Clear container and render this recipient's certificate
      container.innerHTML = '';
      await renderCertificate(recipient, container);

      // Small delay to let React/DOM paint
      await new Promise(r => setTimeout(r, 100));

      const certEl = container.firstElementChild;
      if (!certEl) throw new Error(`Certificate element not rendered for recipient: ${recipient.name}`);

      const canvas = await captureElement(certEl, scale);

      // On first certificate, initialise the PDF with the correct page size
      if (i === 0) {
        mmW = (canvas.width / scale) * 0.264583;
        mmH = (canvas.height / scale) * 0.264583;

        pdf = new jsPDF({
          orientation: mmW >= mmH ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [mmW, mmH],
        });
      } else {
        pdf.addPage([mmW, mmH], mmW >= mmH ? 'landscape' : 'portrait');
      }

      const dataURL = imageFormat === 'jpg'
        ? canvas.toDataURL('image/jpeg', 0.92)
        : canvas.toDataURL('image/png');

      pdf.addImage(dataURL, imageFormat === 'jpg' ? 'JPEG' : 'PNG', 0, 0, mmW, mmH, undefined, 'FAST');

      if (onProgress) onProgress(i + 1, recipients.length);
    }

    pdf.save(filename);
    return { success: true, count: recipients.length };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Export all certificates as individual JPG files downloaded one by one.
 * (Use exportBulkPDF for a single-file download instead.)
 *
 * @param {Object[]} recipients
 * @param {Function} renderCertificate  — (recipient, container) => void
 * @param {Object}   options
 */
export async function exportBulkJPG(recipients, renderCertificate, options = {}) {
  const {
    scale = 2,
    quality = 0.92,
    onProgress = null,
  } = options;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;z-index:-1;';
  document.body.appendChild(container);

  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      container.innerHTML = '';
      await renderCertificate(recipient, container);
      await new Promise(r => setTimeout(r, 100));

      const certEl = container.firstElementChild;
      if (!certEl) continue;

      const canvas = await captureElement(certEl, scale);
      const safeName = (recipient.name || `certificate-${i + 1}`).replace(/[^a-z0-9]/gi, '-');
      downloadDataURL(canvas.toDataURL('image/jpeg', quality), `${safeName}.jpg`);

      if (onProgress) onProgress(i + 1, recipients.length);

      // Small delay between downloads so browser doesn't block them
      await new Promise(r => setTimeout(r, 200));
    }
    return { success: true, count: recipients.length };
  } finally {
    document.body.removeChild(container);
  }
}