import fs from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';

// Base directory for uploads
// Using an absolute path to ensure consistency across environments
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Export the uploads directory path for use in other modules
export { UPLOADS_DIR };

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
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}
