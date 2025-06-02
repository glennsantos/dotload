import fs from 'fs';
import path from 'path';
import { mkdir, writeFile, access, stat, readdir } from 'fs/promises';
import crypto from 'crypto';
import { constants } from 'fs';

// Base directory for uploads
// Using an absolute path to ensure consistency across environments
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Export the uploads directory path for use in other modules
export { UPLOADS_DIR };

/**
 * Enhanced file resolver to find files no matter where they're stored
 * @param filePath - The original file path from the database
 * @returns An object with the resolved path and whether the file exists
 */
export async function resolveFilePath(filePath: string): Promise<{ path: string; exists: boolean; size?: number }> {
  console.log(`[FILE-RESOLVER] Resolving file path: ${filePath}`);
  
  // STEP 1: Parse the file path information
  const parsedPath = parseFilePath(filePath);
  console.log(`[FILE-RESOLVER] Parsed path info:`, parsedPath);
  
  // STEP 2: Generate all possible path combinations
  const pathsToTry = generatePathCombinations(parsedPath);
  console.log(`[FILE-RESOLVER] Will try ${pathsToTry.length} possible paths`);
  
  // STEP 3: Try each path systematically
  for (const path of pathsToTry) {
    try {
      await access(path, constants.F_OK);
      const stats = await stat(path);
      console.log(`[FILE-RESOLVER] ✅ FOUND at: ${path}, size: ${stats.size} bytes`);
      return { path, exists: true, size: stats.size };
    } catch (err) {
      console.log(`[FILE-RESOLVER] ❌ Not found at: ${path}`);
    }
  }
  
  // STEP 4: If still not found, do a filesystem search as last resort
  console.log(`[FILE-RESOLVER] File not found in expected locations, performing filesystem search...`);
  const fileNamePart = parsedPath.fileName || path.basename(filePath);
  const foundFile = await findFileInUploadsDirectory(fileNamePart, parsedPath.userId, parsedPath.productId);
  
  if (foundFile) {
    console.log(`[FILE-RESOLVER] ✅ Found file via filesystem search: ${foundFile}`);
    const stats = await stat(foundFile);
    return { path: foundFile, exists: true, size: stats.size };
  }
  
  // STEP 5: Log helpful debug information if file still not found
  await logDirectoryContents(parsedPath.userId, parsedPath.productId);
  
  // Return the first option if none worked
  return { path: pathsToTry[0], exists: false };
}

/**
 * Parse a file path into its component parts
 */
export function parseFilePath(filePath: string): {
  isAbsolute: boolean;
  containsUploads: boolean;
  userId?: string;
  productId?: string;
  fileName?: string;
  userDirType?: 'user' | 'users';
} {
  const result: {
    isAbsolute: boolean;
    containsUploads: boolean;
    userDirType?: 'user' | 'users';
    userId?: string;
    productId?: string;
    fileName: string;
  } = {
    isAbsolute: filePath.startsWith('/'),
    containsUploads: filePath.includes('uploads/'),
    userDirType: filePath.includes('/users/') ? 'users' as const : 
                 filePath.includes('/user/') ? 'user' as const : undefined,
    userId: undefined,
    productId: undefined,
    fileName: path.basename(filePath)
  };
  
  // Extract userId and productId from path
  const userMatch = filePath.match(/\/(users?)\/([^/]+)\/products\/([^/]+)\//i);
  if (userMatch) {
    result.userDirType = userMatch[1] === 'users' ? 'users' : 'user';
    result.userId = userMatch[2];
    result.productId = userMatch[3];
  }
  
  return result;
}

/**
 * Generate all possible path combinations based on parsed path information
 */
export function generatePathCombinations(parsedPath: ReturnType<typeof parseFilePath>): string[] {
  const paths: string[] = [];
  const cwd = process.cwd();
  const { userId, productId, fileName, isAbsolute } = parsedPath;
  
  // If we have a complete path with userId and productId, create all variants
  if (userId && productId && fileName) {
    // Both singular and plural user directory variants
    ['user', 'users'].forEach(userDir => {
      // With and without 'files' subdirectory
      ['', 'files/'].forEach(filesDir => {
        // Absolute path
        paths.push(path.join(cwd, 'uploads', userDir, userId, 'products', productId, filesDir, fileName));
      });
    });
  }
  
  // The original path as-is
  if (isAbsolute && parsedPath.fileName) {
    paths.push(parsedPath.isAbsolute ? parsedPath.fileName : path.join(cwd, parsedPath.fileName));
  }
  
  // If path contains uploads and we have a filename, try both with and without project root
  if (parsedPath.containsUploads && parsedPath.fileName) {
    paths.push(path.join(cwd, parsedPath.fileName));
  }
  
  // Add original file path with cwd prefix if not absolute and we have a filename
  if (!isAbsolute && parsedPath.fileName) {
    paths.push(path.join(cwd, parsedPath.fileName));
  }
  
  return [...new Set(paths)]; // Remove duplicates
}

/**
 * Find a file anywhere in the uploads directory by recursively searching
 * This is a more expensive operation but ensures we find the file even if paths are inconsistent
 */
export async function findFileInUploadsDirectory(
  fileNamePart: string,
  userId?: string,
  productId?: string
): Promise<string | null> {
  try {
    const cwd = process.cwd();
    const uploadsDir = path.join(cwd, 'uploads');
    
    // Function to recursively search for files
    const searchDirectory = async (dir: string, depth: number = 0): Promise<string | null> => {
      if (depth > 7) return null; // Limit recursion depth
      
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        // First, look for direct matches in current directory
        for (const entry of entries) {
          if (!entry.isDirectory() && entry.name.includes(fileNamePart)) {
            return path.join(dir, entry.name);
          }
        }
        
        // If we have userId and productId, prioritize those directories
        if (userId && productId) {
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (entry.name === 'user' || entry.name === 'users') {
                const userDir = path.join(dir, entry.name);
                const userEntries = await readdir(userDir, { withFileTypes: true });
                
                for (const userEntry of userEntries) {
                  if (userEntry.isDirectory() && userEntry.name === userId) {
                    const specificUserDir = path.join(userDir, userId);
                    const productsDir = path.join(specificUserDir, 'products');
                    
                    try {
                      const productEntries = await readdir(productsDir, { withFileTypes: true });
                      
                      for (const productEntry of productEntries) {
                        if (productEntry.isDirectory() && productEntry.name === productId) {
                          const specificProductDir = path.join(productsDir, productId);
                          const productFiles = await readdir(specificProductDir);
                          
                          for (const file of productFiles) {
                            if (file.includes(fileNamePart)) {
                              return path.join(specificProductDir, file);
                            }
                          }
                          
                          // Check in files subdirectory if exists
                          const filesDir = path.join(specificProductDir, 'files');
                          try {
                            const filesInSubdir = await readdir(filesDir);
                            for (const file of filesInSubdir) {
                              if (file.includes(fileNamePart)) {
                                return path.join(filesDir, file);
                              }
                            }
                          } catch (e) {
                            // files subdirectory might not exist, ignore
                          }
                        }
                      }
                    } catch (e) {
                      // products directory might not exist, continue searching
                    }
                  }
                }
              }
            }
          }
        }
        
        // If not found, search recursively in subdirectories
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const result = await searchDirectory(path.join(dir, entry.name), depth + 1);
            if (result) return result;
          }
        }
        
        return null;
      } catch (error) {
        console.error(`Error searching directory ${dir}:`, error);
        return null;
      }
    };
    
    return await searchDirectory(uploadsDir);
  } catch (error) {
    console.error('Error in findFileInUploadsDirectory:', error);
    return null;
  }
}

/**
 * Log directory contents to help with debugging
 */
async function logDirectoryContents(userId?: string, productId?: string): Promise<void> {
  try {
    const cwd = process.cwd();
    const uploadsDir = path.join(cwd, 'uploads');
    console.log(`[FILE-RESOLVER] Debug: Listing uploads directory contents:`);
    
    // Check if uploads directory exists
    const uploadsExists = await access(uploadsDir, constants.F_OK)
      .then(() => true)
      .catch(() => false);
    
    if (!uploadsExists) {
      console.log(`[FILE-RESOLVER] Debug: Uploads directory does not exist!`);
      return;
    }
    
    // List uploads directory
    const uploadsContents = await readdir(uploadsDir, { withFileTypes: true });
    console.log(uploadsContents.map(entry => 
      `${entry.name} ${entry.isDirectory() ? '(dir)' : '(file)'}`
    ).join('\n'));
    
    // If we have userId, check user directories
    if (userId) {
      // Check both user and users directories
      for (const userDir of ['user', 'users']) {
        const userDirPath = path.join(uploadsDir, userDir);
        const userDirExists = await access(userDirPath, constants.F_OK)
          .then(() => true)
          .catch(() => false);
        
        if (userDirExists) {
          console.log(`[FILE-RESOLVER] Debug: Found ${userDir} directory`);
          
          const userIdDirPath = path.join(userDirPath, userId);
          const userIdDirExists = await access(userIdDirPath, constants.F_OK)
            .then(() => true)
            .catch(() => false);
          
          if (userIdDirExists) {
            console.log(`[FILE-RESOLVER] Debug: Found user directory for ${userId}`);
            
            // If we have productId, check product directories
            if (productId) {
              const productsDir = path.join(userIdDirPath, 'products');
              const productsDirExists = await access(productsDir, constants.F_OK)
                .then(() => true)
                .catch(() => false);
              
              if (productsDirExists) {
                console.log(`[FILE-RESOLVER] Debug: Found products directory`);
                
                const productDirPath = path.join(productsDir, productId);
                const productDirExists = await access(productDirPath, constants.F_OK)
                  .then(() => true)
                  .catch(() => false);
                
                if (productDirExists) {
                  console.log(`[FILE-RESOLVER] Debug: Found product directory for ${productId}`);
                  
                  // List files in the product directory
                  const productFiles = await readdir(productDirPath);
                  console.log(`[FILE-RESOLVER] Debug: Files in product directory:`);
                  console.log(productFiles.join('\n'));
                  
                  // Also check files subdirectory if it exists
                  const filesDir = path.join(productDirPath, 'files');
                  const filesDirExists = await access(filesDir, constants.F_OK)
                    .then(() => true)
                    .catch(() => false);
                  
                  if (filesDirExists) {
                    const filesInSubdir = await readdir(filesDir);
                    console.log(`[FILE-RESOLVER] Debug: Files in 'files' subdirectory:`);
                    console.log(filesInSubdir.join('\n'));
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`[FILE-RESOLVER] Error listing directories:`, error);
  }
}

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
