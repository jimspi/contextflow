/**
 * File Processing Utilities
 * Client-side wrapper that sends files to the server for processing
 */

/**
 * Main function to process any supported file type
 * Sends file to server-side API for processing
 */
export async function processFile(file) {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  // For simple text-based files, process client-side
  if (['csv', 'json', 'txt'].includes(fileExtension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          let content;

          if (fileExtension === 'csv') {
            // Parse CSV
            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0] || [];
            const dataRows = rows.slice(1);
            content = dataRows
              .map(row => {
                return headers.map((header, i) => `${header}: ${row[i] || ''}`).join(', ');
              })
              .join('\n');
          } else if (fileExtension === 'json') {
            // Parse JSON
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              content = data.map(item => JSON.stringify(item, null, 2)).join('\n\n');
            } else if (typeof data === 'object') {
              content = JSON.stringify(data, null, 2);
            } else {
              content = String(data);
            }
          } else {
            content = text;
          }

          resolve({
            title: file.name.replace(/\.(csv|json|txt)$/, ''),
            content: content,
            source: fileExtension.toUpperCase() + ' File'
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // For binary files (Word, PDF, Images), send to server
  if (['docx', 'pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
    console.log('[FILE PROCESSOR] Processing binary file:', fileName, 'extension:', fileExtension);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          // Convert to base64 for sending to server
          const base64Data = e.target.result.split(',')[1];
          console.log('[FILE PROCESSOR] Converted to base64, length:', base64Data.length);

          console.log('[FILE PROCESSOR] Sending to /api/process-file...');
          const response = await fetch('/api/process-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              fileType: file.type
            })
          });

          console.log('[FILE PROCESSOR] API response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[FILE PROCESSOR] API error:', errorData);
            throw new Error(errorData.error || 'Failed to process file');
          }

          const data = await response.json();
          console.log('[FILE PROCESSOR] API returned data:', data);

          if (!data.result) {
            throw new Error('API response missing result field');
          }

          console.log('[FILE PROCESSOR] Successfully processed file:', data.result);
          resolve(data.result);
        } catch (error) {
          console.error('[FILE PROCESSOR] Error processing file:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        console.error('[FILE PROCESSOR] FileReader error');
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  throw new Error(`Unsupported file type: ${fileExtension}`);
}
