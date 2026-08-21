/**
 * Legacy compatibility component.
 *
 * Route metadata and structured data are owned by SEOHead/seoData. This
 * component intentionally renders nothing: injecting off-screen headings or
 * crawler-only copy creates duplicate document structure and can contradict
 * the visible page.
 */
export default function CrawlerFallback() {
  return null;
}
