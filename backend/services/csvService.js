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

    // Add form response columns
    formSections.forEach(section => {
      headers.push({
        id: `response_${section.id}`,
        title: section.label || section.type,
      });
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
        phone: reg.phone,
        registeredAt: reg.registeredAt,
        checkedIn: reg.checkedIn ? 'Yes' : 'No',
        checkedInAt: reg.checkedInAt || '',
      };

      // Add form responses
      formSections.forEach(section => {
        record[`response_${section.id}`] = reg.responses?.get(section.id) || '';
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
