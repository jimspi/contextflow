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

  let fileName = 'unknown';

  try {
    const { fileData, fileName: reqFileName, fileType } = req.body;
    fileName = reqFileName;

    console.log(`[API] Processing file: ${fileName}, type: ${fileType}`);

    if (!fileData || !fileName) {
      console.error('[API] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields (fileData or fileName)' });
    }

    // Convert base64 to buffer
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
      console.log(`[API] Buffer size: ${buffer.length} bytes`);
    } catch (bufferError) {
      console.error('[API] Failed to decode base64:', bufferError);
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    let content = '';
    let source = '';

    // Process based on file type
    if (fileName.toLowerCase().endsWith('.docx')) {
      console.log('[API] Processing Word document...');
      try {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
        source = 'Word Document';
        console.log(`[API] Extracted ${content.length} characters from Word doc`);
      } catch (docxError) {
        console.error('[API] Word processing error:', docxError);
        throw new Error(`Failed to process Word document: ${docxError.message}`);
      }
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      console.log('[API] Processing PDF...');
      try {
        const data = await pdf(buffer);
        content = data.text;
        source = 'PDF Document';
        console.log(`[API] Extracted ${content.length} characters from PDF`);
      } catch (pdfError) {
        console.error('[API] PDF processing error:', pdfError);
        throw new Error(`Failed to process PDF: ${pdfError.message}`);
      }
    } else if (fileName.match(/\.(jpg|jpeg|png)$/i)) {
      console.log('[API] Processing image with OCR...');
      try {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        content = text.trim();
        source = 'Image (OCR)';
        console.log(`[API] Extracted ${content.length} characters from image`);
      } catch (ocrError) {
        console.error('[API] OCR error:', ocrError);
        throw new Error(`Failed to perform OCR on image: ${ocrError.message}`);
      }
    } else if (fileName.toLowerCase().endsWith('.txt')) {
      console.log('[API] Processing text file...');
      content = buffer.toString('utf-8');
      source = 'Text File';
    } else if (fileName.toLowerCase().endsWith('.csv')) {
      console.log('[API] Processing CSV...');
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
      console.log('[API] Processing JSON...');
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
      console.error(`[API] Unsupported file type: ${fileName}`);
      return res.status(400).json({ error: `Unsupported file type: ${fileName}` });
    }

    if (!content || content.trim().length === 0) {
      console.warn('[API] Warning: No content extracted from file');
      content = '(No text content could be extracted from this file)';
    }

    const title = fileName.replace(/\.(docx|pdf|jpg|jpeg|png|txt|csv|json)$/i, '');

    console.log(`[API] Successfully processed ${fileName}`);

    return res.status(200).json({
      success: true,
      result: {
        title,
        content,
        source
      }
    });
  } catch (error) {
    console.error(`[API] Error processing file ${fileName}:`, error);
    return res.status(500).json({
      error: 'Failed to process file',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
