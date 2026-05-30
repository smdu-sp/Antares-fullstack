/** @format */

/**
 * Server Components can reach the backend via the internal URL (same machine).
 * Client Components (browser) must use the public-facing URL.
 *
 * Set API_INTERNAL_URL in production for efficient server-side calls.
 * NEXT_PUBLIC_API_URL must always be the public domain.
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}
