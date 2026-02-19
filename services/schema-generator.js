const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');

/**
 * Schema Markup Generator
 *
 * Generates JSON-LD structured data for ecommerce pages.
 * Goes beyond detection — actually creates the markup you need.
 */
class SchemaGenerator {
  /**
   * Generate Product schema for a Shopify product
   */
  generateProductSchema({ name, description, imageUrl, price, currency = 'USD', availability = 'InStock', brand, sku, url, rating, reviewCount }) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: this._stripHtml(description || '').substring(0, 500),
      image: imageUrl || undefined,
      brand: brand ? { '@type': 'Brand', name: brand } : undefined,
      sku: sku || undefined,
      url: url || undefined,
      offers: {
        '@type': 'Offer',
        price: price || undefined,
        priceCurrency: currency,
        availability: `https://schema.org/${availability}`,
        url: url || undefined,
      },
    };

    if (rating && reviewCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
      };
    }

    return this._clean(schema);
  }

  /**
   * Generate FAQ schema from question-answer pairs
   */
  generateFAQSchema(faqs) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  /**
   * Generate Article schema for blog posts
   */
  generateArticleSchema({ title, description, imageUrl, authorName, publishDate, modifiedDate, url, publisherName, publisherLogo }) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description || undefined,
      image: imageUrl || undefined,
      author: {
        '@type': authorName ? 'Person' : 'Organization',
        name: authorName || publisherName || undefined,
      },
      publisher: {
        '@type': 'Organization',
        name: publisherName || undefined,
        logo: publisherLogo ? { '@type': 'ImageObject', url: publisherLogo } : undefined,
      },
      datePublished: publishDate || undefined,
      dateModified: modifiedDate || publishDate || undefined,
      mainEntityOfPage: url || undefined,
    });
  }

  /**
   * Generate Organization schema for the brand (critical for GEO)
   */
  generateOrganizationSchema({ name, url, logo, description, socialProfiles = [], phone, email, address }) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url,
      logo: logo || undefined,
      description: description || undefined,
      sameAs: socialProfiles.length > 0 ? socialProfiles : undefined,
      contactPoint: phone || email ? {
        '@type': 'ContactPoint',
        telephone: phone || undefined,
        email: email || undefined,
        contactType: 'customer service',
      } : undefined,
    };

    if (address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: address.street || undefined,
        addressLocality: address.city || undefined,
        addressRegion: address.state || undefined,
        postalCode: address.zip || undefined,
        addressCountry: address.country || undefined,
      };
    }

    return this._clean(schema);
  }

  /**
   * Generate BreadcrumbList schema
   */
  generateBreadcrumbSchema(items) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url || undefined,
      })),
    });
  }

  /**
   * Generate HowTo schema (great for guides and tutorials)
   */
  generateHowToSchema({ name, description, totalTime, steps, imageUrl }) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description: description || undefined,
      totalTime: totalTime || undefined,
      image: imageUrl || undefined,
      step: steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.name || `Step ${i + 1}`,
        text: step.text,
        image: step.imageUrl || undefined,
      })),
    });
  }

  /**
   * Generate Review schema for displaying star ratings in SERPs
   */
  generateReviewSchema({ itemName, itemType = 'Product', ratingValue, bestRating = 5, authorName, reviewBody, datePublished }) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': itemType,
        name: itemName,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue,
        bestRating,
      },
      author: {
        '@type': 'Person',
        name: authorName,
      },
      reviewBody: reviewBody || undefined,
      datePublished: datePublished || undefined,
    });
  }

  /**
   * Generate LocalBusiness schema (if the brand has a physical presence)
   */
  generateLocalBusinessSchema({ name, url, phone, address, openingHours, imageUrl, priceRange }) {
    return this._clean({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name,
      url: url || undefined,
      telephone: phone || undefined,
      image: imageUrl || undefined,
      priceRange: priceRange || undefined,
      address: address ? {
        '@type': 'PostalAddress',
        streetAddress: address.street || undefined,
        addressLocality: address.city || undefined,
        addressRegion: address.state || undefined,
        postalCode: address.zip || undefined,
        addressCountry: address.country || undefined,
      } : undefined,
      openingHoursSpecification: openingHours || undefined,
    });
  }

  /**
   * Scan a page and recommend which schemas should be added
   */
  async recommendSchemas(pageUrl) {
    try {
      const response = await axios.get(pageUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const $ = cheerio.load(response.data);

      // Check what schemas already exist
      const existing = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          existing.push(data['@type'] || 'Unknown');
        } catch { /* skip */ }
      });

      const recommendations = [];
      const urlPath = new URL(pageUrl).pathname;

      // Product page detection
      if (urlPath.includes('/products/') || $('[data-product-id], .product-single, .product-template').length > 0) {
        if (!existing.includes('Product')) {
          recommendations.push({
            type: 'Product',
            priority: 'high',
            reason: 'Product page detected without Product schema. Adding this enables rich snippets with price and availability in search results.',
          });
        }
      }

      // Blog/article detection
      if (urlPath.includes('/blog') || urlPath.includes('/articles') || $('article, .blog-post, .article-content').length > 0) {
        if (!existing.includes('Article') && !existing.includes('BlogPosting')) {
          recommendations.push({
            type: 'Article',
            priority: 'high',
            reason: 'Blog/article content detected without Article schema. This helps search engines understand authorship and publish dates.',
          });
        }
      }

      // FAQ detection
      const hasFAQContent = $('h2, h3').filter((_, el) => /faq|frequently asked|questions/i.test($(el).text())).length > 0;
      if (hasFAQContent && !existing.includes('FAQPage')) {
        recommendations.push({
          type: 'FAQPage',
          priority: 'high',
          reason: 'FAQ content found without FAQPage schema. This can generate expandable FAQ rich snippets in search results.',
        });
      }

      // Organization (homepage)
      if (urlPath === '/' || urlPath === '') {
        if (!existing.includes('Organization') && !existing.includes('WebSite')) {
          recommendations.push({
            type: 'Organization',
            priority: 'medium',
            reason: 'Homepage without Organization schema. This helps establish brand entity recognition in knowledge panels.',
          });
        }
      }

      // Breadcrumb
      if ($('.breadcrumb, [aria-label="breadcrumb"], .breadcrumbs').length > 0 && !existing.includes('BreadcrumbList')) {
        recommendations.push({
          type: 'BreadcrumbList',
          priority: 'medium',
          reason: 'Breadcrumb navigation found without BreadcrumbList schema. This improves how your page hierarchy appears in search results.',
        });
      }

      // HowTo detection
      const hasSteps = $('ol li, .step, .steps').length >= 3;
      if (hasSteps && !existing.includes('HowTo')) {
        recommendations.push({
          type: 'HowTo',
          priority: 'low',
          reason: 'Step-by-step content detected. HowTo schema can generate rich results showing your steps directly in search.',
        });
      }

      return {
        url: pageUrl,
        existing_schemas: existing,
        recommendations,
        total_schemas_found: existing.length,
      };
    } catch (err) {
      return { url: pageUrl, error: err.message, existing_schemas: [], recommendations: [] };
    }
  }

  /**
   * Generate all recommended schemas for a page in one call
   */
  async generateAllForPage(pageUrl, siteData = {}) {
    const recs = await this.recommendSchemas(pageUrl);
    const schemas = {};

    for (const rec of recs.recommendations) {
      switch (rec.type) {
        case 'Organization':
          if (siteData.brandName) {
            schemas.Organization = this.generateOrganizationSchema({
              name: siteData.brandName,
              url: siteData.siteUrl || pageUrl,
              logo: siteData.logoUrl,
              description: siteData.description,
              socialProfiles: siteData.socialProfiles || [],
            });
          }
          break;
        case 'BreadcrumbList':
          // Auto-generate from URL path
          schemas.BreadcrumbList = this._breadcrumbFromUrl(pageUrl);
          break;
      }
    }

    return {
      url: pageUrl,
      existing: recs.existing_schemas,
      recommendations: recs.recommendations,
      generated_schemas: schemas,
    };
  }

  // ==================== Helpers ====================

  _breadcrumbFromUrl(url) {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const items = [{ name: 'Home', url: `${parsed.protocol}//${parsed.hostname}` }];

    let path = '';
    for (const part of parts) {
      path += `/${part}`;
      items.push({
        name: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        url: `${parsed.protocol}//${parsed.hostname}${path}`,
      });
    }

    return this.generateBreadcrumbSchema(items);
  }

  _stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  _clean(obj) {
    // Remove undefined values for clean JSON-LD output
    return JSON.parse(JSON.stringify(obj));
  }
}

module.exports = new SchemaGenerator();
