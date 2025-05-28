import fs from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';

// Base directory for uploads
// Using an absolute path to ensure consistency across environments
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Export the uploads directory path for use in other modules
export { UPLOADS_DIR };

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

// Ensure uploads directory exists
export async function ensureUploadsDirectory(subPath: string = ''): Promise<string> {
  const dirPath = path.join(UPLOADS_DIR, subPath);
  
  try {
    await mkdir(dirPath, { recursive: true });
    
    // Check if directory is writable
    try {
      const testFile = path.join(dirPath, '.write-test');
      await writeFile(testFile, '');
      await fs.promises.unlink(testFile);
      console.log(`Uploads directory is writable: ${dirPath}`);
    } catch (writeError) {
      console.error('Uploads directory exists but is not writable:', 
        writeError instanceof Error ? writeError.message : String(writeError));
      throw new Error('Uploads directory is not writable');
    }
    
    return dirPath;
  } catch (error) {
    console.error('Error creating directory:', error);
    throw new Error(`Failed to create upload directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Generate a secure filename to prevent path traversal attacks
export function generateSecureFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  const safeName = path.basename(originalFilename, extension)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase();
  
  return `${safeName}-${timestamp}-${randomString}${extension}`;
}

// Save a file to the uploads directory
export async function saveFile(
  buffer: Buffer, 
  filename: string, 
  userId: string, 
  productId: string
): Promise<{ path: string, url: string }> {
  // Create a secure path structure: uploads/users/{userId}/products/{productId}/files
  const relativePath = path.join('users', userId, 'products', productId, 'files');
  const uploadDir = await ensureUploadsDirectory(relativePath);
  
  // Generate a secure filename
  const secureFilename = generateSecureFilename(filename);
  const filePath = path.join(uploadDir, secureFilename);
  
  // Save the file - convert Buffer to Uint8Array to avoid type issues
  await writeFile(filePath, new Uint8Array(buffer));
  
  // Generate a URL that will be used by the secure file access API
  const relativeFilePath = path.join(relativePath, secureFilename);
  const fileUrl = `/api/secure-files/${encodeURIComponent(relativeFilePath)}`;
  
  return {
    path: relativeFilePath,
    url: fileUrl
  };
}

// Check if a file exists
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Get the absolute path for a file
export function getAbsoluteFilePath(relativePath: string): string {
  return path.join(UPLOADS_DIR, relativePath);
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
