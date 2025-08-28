/**
 * Session URL utilities for descriptive, SEO-friendly session codes
 */

// Note: generateId not needed for URL generation

/**
 * Generate a descriptive session URL slug
 * Format: {sessionName}-{randomNumber}
 * Example: "team-building-workshop-2"
 */
export function generateSessionSlug(sessionName: string): string {
  // Clean the session name
  const cleanName = sessionName
    .toLowerCase()
    .trim()
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Add random number (0-99) for uniqueness
  const randomNum = Math.floor(Math.random() * 100);

  // Combine and ensure reasonable length
  const baseSlug = cleanName.substring(0, 30); // Limit base name length
  const fullSlug = `${baseSlug}-${randomNum}`;

  return fullSlug;
}

/**
 * Validate session URL slug format
 * Must contain at least one letter, end with a number, and be URL-safe
 */
export function validateSessionSlug(slug: string): boolean {
  // Must be lowercase, contain only letters, numbers, and hyphens
  // Must end with a number (0-99)
  // Must contain at least one letter
  const slugRegex = /^[a-z0-9-]+-[0-9]{1,2}$/;

  if (!slugRegex.test(slug)) return false;

  // Must contain at least one letter (not just numbers and hyphens)
  const hasLetter = /[a-z]/.test(slug);
  if (!hasLetter) return false;

  // Number at the end should be 0-99
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  const num = parseInt(lastPart, 10);
  if (isNaN(num) || num < 0 || num > 99) return false;

  return true;
}

/**
 * Extract session name from slug
 * Example: "team-building-workshop-2" -> "Team Building Workshop"
 */
export function extractSessionNameFromSlug(slug: string): string {
  if (!validateSessionSlug(slug)) return slug;

  const parts = slug.split('-');
  parts.pop(); // Remove the number part
  const nameParts = parts;

  // Convert to title case
  return nameParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate multiple unique slugs for a session name
 * Useful for avoiding collisions
 */
export function generateUniqueSessionSlugs(sessionName: string, count: number = 5): string[] {
  const slugs = new Set<string>();

  while (slugs.size < count) {
    const slug = generateSessionSlug(sessionName);
    slugs.add(slug);
  }

  return Array.from(slugs);
}

/**
 * Legacy support: Convert old 6-character codes to new slugs
 * This helps with backward compatibility during migration
 */
export function convertLegacyCodeToSlug(legacyCode: string, sessionName?: string): string {
  if (!sessionName) {
    // If no session name, just append a number to the legacy code
    return `${legacyCode.toLowerCase()}-0`;
  }

  return generateSessionSlug(sessionName);
}