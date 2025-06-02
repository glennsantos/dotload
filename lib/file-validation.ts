import path from 'path';

// List of allowed file extensions for digital files
export const ALLOWED_DIGITAL_FILE_EXTENSIONS = [
  '.csv', '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp4', '.mp3', '.wav', '.zip', '.rar', '.7z', '.xls', '.xlsx', '.md',
  '.epub', '.mobi', '.pptx', '.txt', '.svg', '.ai', '.eps', '.psd',
  '.aac', '.flac', '.m4b', '.mov', '.avi', '.mkv', '.webm', '.cube',
  '.look', '.xmp', '.html', '.woff', '.woff2', '.ttf', '.otf', '.notion'
];

// List of allowed MIME types for digital files
export const ALLOWED_DIGITAL_FILE_MIME_TYPES = [
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/markdown',
  'application/epub+zip',
  'application/x-mobipocket-ebook',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/svg+xml',
  'application/illustrator',
  'application/postscript',
  'image/vnd.adobe.photoshop',
  'audio/aac',
  'audio/flac',
  'audio/x-m4b',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'application/octet-stream', // For .cube, .look files
  'application/xmp',
  'text/html',
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/notion' // Custom MIME type for Notion files
];

// Export the extensions as a comma-separated string for HTML accept attribute
export const ALLOWED_EXTENSIONS_FOR_HTML_ACCEPT = ALLOWED_DIGITAL_FILE_EXTENSIONS.join(',');

// Export MIME types as a comma-separated string
export const ALLOWED_MIME_TYPES_FOR_HTML_ACCEPT = ALLOWED_DIGITAL_FILE_MIME_TYPES.join(',');

// Function to validate file type based on extension only (for frontend validation)
export function isAllowedFileExtension(filename: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  return ALLOWED_DIGITAL_FILE_EXTENSIONS.includes(extension);
}

// Function to validate file type based on MIME type only
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_DIGITAL_FILE_MIME_TYPES.includes(mimeType);
}

// Validate if a file is allowed for digital products
export function isAllowedDigitalFile(filename: string, mimeType?: string): boolean {
  // Check by extension first
  const extension = path.extname(filename).toLowerCase();
  const isAllowedExtension = ALLOWED_DIGITAL_FILE_EXTENSIONS.includes(extension);
  
  // If mime type is provided, also check against allowed mime types
  if (mimeType) {
    const isAllowedMimeType = ALLOWED_DIGITAL_FILE_MIME_TYPES.includes(mimeType);
    return isAllowedExtension && isAllowedMimeType;
  }
  
  return isAllowedExtension;
}

// Get file mime type based on extension
export function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
    '.epub': 'application/epub+zip',
    '.mobi': 'application/x-mobipocket-ebook',
    '.wav': 'audio/wav',
    '.ai': 'application/illustrator',
    '.eps': 'application/postscript',
    '.psd': 'image/vnd.adobe.photoshop',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.m4b': 'audio/x-m4b',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.cube': 'application/octet-stream',
    '.look': 'application/octet-stream',
    '.xmp': 'application/xmp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.notion': 'application/notion'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
} 