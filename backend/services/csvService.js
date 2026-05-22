import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeMapLike = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return value;
};

export const exportRegistrationsToCSV = async (registrations, eventTitle, formSections) => {
  try {
    // Build dynamic headers based on form sections
    const headers = [
      { id: 'ticketId', title: 'Ticket ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'registeredAt', title: 'Registered At' },
      { id: 'checkedIn', title: 'Checked In' },
      { id: 'checkedInAt', title: 'Checked In At' },
    ];

    // Add form response columns for all sections
    formSections.forEach(section => {
      // Skip heading and divider sections
      if (section.type === 'heading' || section.type === 'divider') return;
      
      headers.push({
        id: `response_${section.id}`,
        title: section.label || section.type,
      });

      // For file fields, add a separate column for the file URL
      if (section.type === 'file') {
        headers.push({
          id: `file_${section.id}`,
          title: `${section.label || 'File'} - URL`,
        });
      }
    });

    const fileName = `${eventTitle.replace(/\s+/g, '-')}-registrations-${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../exports', fileName);

    const writer = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    const records = registrations.map(reg => {
      const record = {
        ticketId: reg.ticketId,
        name: reg.name,
        email: reg.email,
        phone: reg.phone || '',
        registeredAt: reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : '',
        checkedIn: reg.checkedIn ? 'Yes' : 'No',
        checkedInAt: reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : '',
      };

      // Add form responses and file URLs
      const responses = normalizeMapLike(reg.responses) || {};
      const fileUploads = normalizeMapLike(reg.fileUploads) || {};

      formSections.forEach(section => {
        if (section.type === 'heading' || section.type === 'divider') return;

        const responseValue = responses[section.id] ?? '';
        record[`response_${section.id}`] = responseValue;

        if (section.type === 'file') {
          const fileData = fileUploads[section.id] || null;
          record[`file_${section.id}`] = fileData ? fileData.url || '' : '';
        }
      });

      return record;
    });

    await writer.writeRecords(records);
    return filePath;
  } catch (error) {
    console.error('Error exporting registrations to CSV:', error);
    throw error;
  }
};
