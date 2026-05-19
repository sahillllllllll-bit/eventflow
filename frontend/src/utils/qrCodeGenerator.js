import QRCode from 'qrcode';

/**
 * Generate QR Code as Data URL
 * @param {string} text - Text to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<string>} Data URL of the QR code
 */
export async function generateQRCodeDataURL(text, options = {}) {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      ...options,
    };

    const dataUrl = await QRCode.toDataURL(text, defaultOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR Code with placeholder support
 * @param {string} baseText - Base text with placeholders like {name}, {email}
 * @param {object} data - Data to replace placeholders
 * @returns {Promise<string>} Data URL of the QR code
 */
export async function generateQRCodeWithData(baseText, data = {}) {
  let finalText = baseText;
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'gi');
    finalText = finalText.replace(placeholder, data[key] || `{${key}}`);
  });

  return generateQRCodeDataURL(finalText);
}

/**
 * Placeholder variables that can be used in QR codes
 */
export const QR_PLACEHOLDERS = {
  '{name}': 'Attendee Name',
  '{email}': 'Attendee Email',
  '{event}': 'Event Name',
  '{date}': 'Certificate Issue Date',
  '{code}': 'Certificate Code',
  '{college}': 'College/Organization',
};
