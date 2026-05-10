import QRCode from 'qrcode';

export const generateQRCode = async (ticketId) => {
  try {
    const qrCodeBase64 = await QRCode.toDataURL(ticketId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });
    return qrCodeBase64;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
