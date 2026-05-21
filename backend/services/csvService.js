import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      formSections.forEach(section => {
        if (section.type === 'heading' || section.type === 'divider') return;

        // Handle both Map and plain object responses
        let responseValue = '';
        if (reg.responses) {
          if (reg.responses instanceof Map) {
            responseValue = reg.responses.get(section.id) || '';
          } else if (typeof reg.responses === 'object') {
            responseValue = reg.responses[section.id] || '';
          }
        }
        record[`response_${section.id}`] = responseValue;

        // Add file URL if it's a file field
        if (section.type === 'file') {
          let fileData = null;
          if (reg.fileUploads) {
            if (reg.fileUploads instanceof Map) {
              fileData = reg.fileUploads.get(section.id);
            } else if (typeof reg.fileUploads === 'object') {
              fileData = reg.fileUploads[section.id];
            }
          }
          record[`file_${section.id}`] = fileData ? fileData.url : '';
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
