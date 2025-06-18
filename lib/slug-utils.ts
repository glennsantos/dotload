import { supabaseProductService } from './supabase-db';

/**
 * Generate a URL-friendly slug from a string
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/&/g, '-and-')     // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')   // Remove all non-word characters
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

/**
 * Generate a unique slug for a product using Supabase
 * @param name The product name
 * @param productId Optional product ID to exclude from uniqueness check
 * @returns A unique slug
 */
export async function generateUniqueSlug(name: string, productId?: string): Promise<string> {
  let slug = generateSlug(name);
  let isUnique = false;
  let counter = 1;
  let uniqueSlug = slug;
  
  while (!isUnique) {
    // Check if slug exists in database using Supabase
    const slugExists = await supabaseProductService.slugExists(uniqueSlug, productId);
    
    if (!slugExists) {
      isUnique = true;
    } else {
      // If slug exists, append a number and try again
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }
  
  return uniqueSlug;
}
