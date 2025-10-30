import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

/**
 * API Route to process uploaded files server-side
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    let content = '';
    let source = '';

    // Process based on file type
    if (fileName.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      source = 'Word Document';
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      const data = await pdf(buffer);
      content = data.text;
      source = 'PDF Document';
    } else if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      content = text.trim();
      source = 'Image (OCR)';
    } else if (fileName.toLowerCase().endsWith('.txt')) {
      content = buffer.toString('utf-8');
      source = 'Text File';
    } else if (fileName.toLowerCase().endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);
      content = dataRows
        .map(row => {
          return headers.map((header, i) => `${header}: ${row[i] || ''}`).join(', ');
        })
        .join('\n');
      source = 'CSV File';
    } else if (fileName.toLowerCase().endsWith('.json')) {
      const text = buffer.toString('utf-8');
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        content = data.map(item => JSON.stringify(item, null, 2)).join('\n\n');
      } else if (typeof data === 'object') {
        content = JSON.stringify(data, null, 2);
      } else {
        content = String(data);
      }
      source = 'JSON File';
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const title = fileName.replace(/\.(docx|pdf|jpg|jpeg|png|txt|csv|json)$/i, '');

    return res.status(200).json({
      success: true,
      result: {
        title,
        content,
        source
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return res.status(500).json({
      error: 'Failed to process file',
      message: error.message
    });
  }
}
