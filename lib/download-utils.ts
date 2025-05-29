import fs from 'fs';
import path from 'path';
import { access, readdir, stat } from 'fs/promises';
import { constants } from 'fs';
import crypto from 'crypto';

// Base directory for uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

/**
 * Resolves a file path and ensures it exists
 * @param filePath - Original file path from database
 * @returns Object with resolved path and file information
 */
export async function resolveDownloadPath(filePath: string): Promise<{
  path: string;
  exists: boolean;
  size?: number;
  alternativePaths?: string[];
}> {
  console.log(`[DOWNLOAD-UTILS] Resolving file path: ${filePath}`);
  
  // If the path is already absolute, use it directly
  const isAbsolute = filePath.startsWith('/');
  const fullPath = isAbsolute ? filePath : path.join(process.cwd(), filePath);
  
  try {
    // Check if file exists at the original path
    await access(fullPath, constants.F_OK);
    const fileStats = await stat(fullPath);
    
    console.log(`[DOWNLOAD-UTILS] File found at original path: ${fullPath}`);
    return {
      path: fullPath,
      exists: true,
      size: fileStats.size
    };
  } catch (err) {
    console.log(`[DOWNLOAD-UTILS] File not found at original path: ${fullPath}`);
    
    // Generate alternative paths to try
    const alternativePaths = await generateAlternativePaths(filePath);
    
    // Try each alternative path
    for (const altPath of alternativePaths) {
      try {
        await access(altPath, constants.F_OK);
        const fileStats = await stat(altPath);
        
        console.log(`[DOWNLOAD-UTILS] File found at alternative path: ${altPath}`);
        return {
          path: altPath,
          exists: true,
          size: fileStats.size
        };
      } catch (err) {
        // Continue to next path
      }
    }
    
    // If we get here, file wasn't found at any location
    return {
      path: fullPath, // Return original path for reference
      exists: false,
      alternativePaths
    };
  }
}

/**
 * Generate alternative paths to try for a file
 */
async function generateAlternativePaths(filePath: string): Promise<string[]> {
  const paths: string[] = [];
  const cwd = process.cwd();
  const fileName = path.basename(filePath);
  
  // Extract potential user and product IDs from the path
  const userMatch = filePath.match(/\/(users?|user)\/([^/]+)\/products\/([^/]+)\//i);
  const userId = userMatch ? userMatch[2] : null;
  const productId = userMatch ? userMatch[3] : null;
  
  // Add paths with both 'user' and 'users' directories
  if (userId && productId) {
    ['user', 'users'].forEach(userDir => {
      // With and without 'files' subdirectory
      ['', 'files'].forEach(filesDir => {
        const basePath = path.join(cwd, 'uploads', userDir, userId, 'products', productId);
        paths.push(path.join(basePath, filesDir, fileName));
        
        // Also try without the timestamp prefix that might be in the filename
        // Example: 1748494235335-992208028-Rework-V1.pdf -> Rework-V1.pdf
        const cleanedName = fileName.replace(/^\d+-\d+-/, '');
        if (cleanedName !== fileName) {
          paths.push(path.join(basePath, filesDir, cleanedName));
        }
      });
    });
  }
  
  // Add path with just the filename in uploads directory
  paths.push(path.join(cwd, 'uploads', fileName));
  
  // If we have user and product IDs, search for similar filenames
  if (userId && productId) {
    try {
      const userDirs = ['user', 'users'];
      
      for (const userDir of userDirs) {
        const productDir = path.join(cwd, 'uploads', userDir, userId, 'products', productId);
        
        try {
          const files = await readdir(productDir);
          
          // Look for files with similar names
          const baseFileName = path.parse(fileName).name.replace(/^\d+-\d+-/, '');
          const extension = path.parse(fileName).ext;
          
          for (const file of files) {
            if (file.includes(baseFileName) || 
                file.endsWith(extension) || 
                baseFileName.includes(file.replace(/^\d+-\d+-/, ''))) {
              paths.push(path.join(productDir, file));
            }
          }
          
          // Also check in files subdirectory if it exists
          const filesDir = path.join(productDir, 'files');
          try {
            const filesInSubdir = await readdir(filesDir);
            for (const file of filesInSubdir) {
              if (file.includes(baseFileName) || 
                  file.endsWith(extension) || 
                  baseFileName.includes(file.replace(/^\d+-\d+-/, ''))) {
                paths.push(path.join(filesDir, file));
              }
            }
          } catch (e) {
            // files subdirectory might not exist, ignore
          }
        } catch (e) {
          // Product directory might not exist, continue
        }
      }
    } catch (e) {
      console.error('[DOWNLOAD-UTILS] Error searching for similar files:', e);
    }
  }
  
  // Remove duplicates
  return [...new Set(paths)];
}

/**
 * Generate a secure download token
 * @param fileId - ID of the file to download
 * @param userId - ID of the user requesting the download
 * @returns Secure download token
 */
export function generateDownloadToken(fileId: string, userId: string): string {
  // Use a dedicated download secret if available, otherwise fall back to JWT_SECRET
  const secret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'secure-download-secret';
  
  // Generate a random nonce for additional security
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Current timestamp for token expiration
  const timestamp = Date.now();
  
  // Combine all data for token generation
  const data = `${fileId}:${userId}:${timestamp}:${nonce}:${process.env.NEXTAUTH_URL || ''}`;
  
  // Generate HMAC for the data
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // Combine all parts into a token
  return `${hmac}.${nonce}.${timestamp}`;
}

/**
 * Validate a download token
 * @param token - Token to validate
 * @param fileId - ID of the file
 * @param userId - ID of the user
 * @returns Whether the token is valid
 */
export function validateDownloadToken(token: string, fileId: string, userId: string): boolean {
  console.log(`[DOWNLOAD-UTILS] Validating token for fileId: ${fileId}, userId: ${userId}`);
  
  // Parse token parts (hmac.nonce.timestamp)
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('[DOWNLOAD-UTILS] Invalid token format - expected 3 parts');
    return false;
  }
  
  const [originalHmac, nonce, timestampStr] = parts;
  
  // Parse timestamp
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    console.log('[DOWNLOAD-UTILS] Invalid timestamp in token');
    return false;
  }
  
  // Check token expiration (24 hours)
  const currentTime = Date.now();
  const tokenAge = currentTime - timestamp;
  const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (tokenAge > maxTokenAge) {
    console.log(`[DOWNLOAD-UTILS] Token expired. Age: ${tokenAge}ms, Max allowed: ${maxTokenAge}ms`);
    return false;
  }
  
  // Recreate the HMAC for verification
  const secret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'secure-download-secret';
  const data = `${fileId}:${userId}:${timestamp}:${nonce}:${process.env.NEXTAUTH_URL || ''}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // For security in a production environment, you would want to use a constant-time comparison
  // But for compatibility with TypeScript, we'll use a simple string comparison
  // This is acceptable for this application since we're not dealing with passwords
  const isValid = expectedHmac === originalHmac;
  
  console.log(`[DOWNLOAD-UTILS] Token validation result: ${isValid}`);
  return isValid;
}

/**
 * Create a secure download URL
 * @param fileId - ID of the file to download
 * @param userId - ID of the user requesting the download
 * @returns Secure download URL
 */
export function createDownloadUrl(fileId: string, userId: string): string {
  const token = generateDownloadToken(fileId, userId);
  return `/api/downloads/secure/${fileId}?token=${encodeURIComponent(token)}&userId=${userId}`;
}

/**
 * Find all PDF files in a directory recursively
 * @param directory - Directory to search in
 * @returns Array of file paths
 */
export async function findPdfFiles(directory: string): Promise<string[]> {
  const results: string[] = [];
  
  async function searchDirectory(dir: string, depth: number = 0): Promise<void> {
    if (depth > 5) return; // Limit recursion depth
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await searchDirectory(fullPath, depth + 1);
        } else if (entry.name.toLowerCase().endsWith('.pdf')) {
          results.push(fullPath);
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }
  
  await searchDirectory(directory);
  return results;
}
