import DOMPurify from 'dompurify'

/**
 * Sanitizes an untrusted string for safe rendering in JSX.
 * Especially useful for content sourced from AppConfig.
 */
export function sanitize(html: string): string {
  // Check if we are in the browser
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html)
  }
  // Fallback for SSR if needed (DOMPurify needs a window object or jsdom)
  return html.replace(/<[^>]*>?/gm, '') // Very basic fallback: strip all tags
}

/**
 * Hook or utility to safely render sanitized HTML.
 * Note: Use sparingly and only for trusted-ish config content.
 */
export const safeHtmlProps = (html: string) => ({
  dangerouslySetInnerHTML: { __html: sanitize(html) },
})
