import { useEffect } from 'react';

/**
 * KnowASport SEOHead Component
 * Lightweight SPA SEO manager that updates document head elements dynamically:
 * - document.title
 * - meta description
 * - canonical link
 * - robots noindex
 * - Open Graph & Twitter Cards
 * - JSON-LD Structured Data
 */
export default function SEOHead({
  title = 'KnowASport — Discover Sports Events Across Tamil Nadu',
  description = 'Discover sports events, local tournaments, and competitions across Tamil Nadu. Register online and connect with athletes and sports communities.',
  canonicalUrl,
  ogImage = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
  ogType = 'website',
  noindex = false,
  jsonLd = null,
}) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to set or update meta tags
    const setMetaTag = (selector, attrName, attrValue, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta Description
    setMetaTag('meta[name="description"]', 'name', 'description', description);

    // 3. Robots Noindex / Index
    let robotsEl = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta');
        robotsEl.setAttribute('name', 'robots');
        document.head.appendChild(robotsEl);
      }
      robotsEl.setAttribute('content', 'noindex, nofollow');
    } else if (robotsEl) {
      robotsEl.setAttribute('content', 'index, follow');
    }

    // 4. Canonical URL
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://knowasport.com';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const resolvedCanonical = canonicalUrl || `${currentOrigin}${currentPath}`;

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!noindex) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', resolvedCanonical);
    } else if (canonicalEl) {
      canonicalEl.remove();
    }

    // 5. Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', resolvedCanonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'KnowASport');

    // 6. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 7. JSON-LD Structured Data
    const scriptId = 'json-ld-structured-data';
    let scriptEl = document.getElementById(scriptId);

    if (jsonLd && !noindex) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd]);

  return null;
}
