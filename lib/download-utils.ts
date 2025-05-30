import fs from 'fs';
import path from 'path';
import { access, readdir, stat } from 'fs/promises';
import { constants } from 'fs';

// Base directory for uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Enable verbose logging for debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DOWNLOAD-UTILS] ${message}`, ...args);
  }
};

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
  debugLog(`Resolving file path: ${filePath}`);
  
  // If the path is already absolute, use it directly
  const isAbsolute = filePath.startsWith('/');
  const fullPath = isAbsolute ? filePath : path.join(process.cwd(), filePath);
  
  try {
    // Check if file exists at the original path
    await access(fullPath, constants.F_OK);
    const fileStats = await stat(fullPath);
    
    debugLog(`File found at original path: ${fullPath}`);
    return {
      path: fullPath,
      exists: true,
      size: fileStats.size
    };
  } catch (err) {
    debugLog(`File not found at original path: ${fullPath}`);
    
    // Generate alternative paths to try
    const alternativePaths = await generateAlternativePaths(filePath);
    
    // Try each alternative path
    for (const altPath of alternativePaths) {
      try {
        await access(altPath, constants.F_OK);
        const fileStats = await stat(altPath);
        
        debugLog(`File found at alternative path: ${altPath}`);
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
      debugLog(`Error searching for similar files: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  
  // Remove duplicates
  return [...new Set(paths)];
}

/**
 * Create a simple download URL
 * @param fileId - ID of the file to download
 * @returns Simple download URL
 */
export function createDownloadUrl(fileId: string): string {
  return `/api/downloads/file/${fileId}`;
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
