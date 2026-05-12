import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate PDF ticket from HTML element
 * @param {HTMLElement} element - The HTML element to convert to PDF
 * @param {string} filename - Filename for the PDF
 */
export const generateTicketPDF = async (element, filename = 'ticket.pdf') => {
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Get image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add image(s) to PDF
    while (heightLeft >= 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position = heightLeft;
      
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
