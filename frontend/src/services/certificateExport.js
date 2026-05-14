import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Certificate Export Service
 * Handles export to PNG, JPG, and PDF formats
 */

export const exportCertificate = {
  /**
   * Export certificate as PNG
   */
  async toPNG(elementId, filename = 'certificate.png') {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Certificate element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: 'Exported as PNG' };
    } catch (error) {
      console.error('PNG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export certificate as JPG
   */
  async toJPG(elementId, filename = 'certificate.jpg', quality = 0.95) {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Certificate element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', quality);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: 'Exported as JPG' };
    } catch (error) {
      console.error('JPG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export certificate as PDF
   */
  async toPDF(elementId, filename = 'certificate.pdf', format = 'A4') {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Certificate element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: format.toUpperCase(),
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      return { success: true, message: 'Exported as PDF' };
    } catch (error) {
      console.error('PDF export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export as high-resolution for print
   */
  async toPrintPNG(elementId, filename = 'certificate-print.png', dpi = 300) {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Certificate element not found');

      const scale = dpi / 96; // 96 is standard screen DPI

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: `Exported as High-Resolution PNG (${dpi}DPI)` };
    } catch (error) {
      console.error('Print PNG export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get certificate as base64 data URL
   */
  async toDataURL(elementId, format = 'png') {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Certificate element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      if (format === 'jpg' || format === 'jpeg') {
        return canvas.toDataURL('image/jpeg', 0.95);
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('DataURL export failed:', error);
      throw error;
    }
  },
};

/**
 * Bulk Certificate Export Service
 * Handle exporting multiple certificates
 */
export const bulkExport = {
  /**
   * Export multiple certificates as ZIP
   */
  async toZIP(certificates, filename = 'certificates.zip') {
    // Note: This requires a ZIP library. Using JSZip would be ideal but it's not in dependencies.
    // For now, we'll create a helper that can be used with JSZip
    console.warn('ZIP export requires additional library. Use JSZip for production.');
    return { success: false, error: 'ZIP export not yet implemented' };
  },

  /**
   * Generate certificates from CSV data
   */
  async generateFromCSV(csvData, templateConfig, exporter) {
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const certificates = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const data = {};

        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        certificates.push(data);
      }

      return { success: true, certificates, count: certificates.length };
    } catch (error) {
      console.error('CSV parsing failed:', error);
      return { success: false, error: error.message };
    }
  },
};
