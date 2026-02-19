const config = require('../config');
const shopify = require('./shopify');
const schemaGenerator = require('./schema-generator');

/**
 * Review & UGC SEO Module
 *
 * Manages the SEO value of reviews and user-generated content.
 * Handles review schema, star ratings in SERPs, and UGC-driven content strategies.
 */
class ReviewSEO {
  /**
   * Audit review SEO across all products.
   * Checks which products have reviews, ratings, and proper schema.
   */
  async auditReviewSEO() {
    if (!shopify.isConfigured()) {
      throw new Error('Shopify not configured. Needed for product review audit.');
    }

    const products = await shopify.getProducts(250);
    const results = [];

    for (const product of products) {
      const metafields = await this._getReviewMetafields(product.id).catch(() => []);

      const reviewData = this._extractReviewData(metafields);

      results.push({
        product_id: product.id,
        product_title: product.title,
        handle: product.handle,
        url: `/products/${product.handle}`,
        has_reviews: reviewData.count > 0,
        review_count: reviewData.count,
        average_rating: reviewData.rating,
        has_review_schema: false, // Would need to check storefront for this
        seo_opportunities: this._identifyReviewOpportunities(product, reviewData),
      });
    }

    const summary = {
      total_products: results.length,
      products_with_reviews: results.filter(r => r.has_reviews).length,
      products_without_reviews: results.filter(r => !r.has_reviews).length,
      average_review_count: results.reduce((s, r) => s + r.review_count, 0) / (results.length || 1),
    };

    return { summary, products: results };
  }

  /**
   * Generate Product schema with review/rating data for a product.
   * This gets star ratings showing in Google search results.
   */
  generateProductReviewSchema({ productName, productUrl, imageUrl, price, currency = 'USD', brand, rating, reviewCount }) {
    return schemaGenerator.generateProductSchema({
      name: productName,
      url: productUrl,
      imageUrl,
      price,
      currency,
      brand,
      rating,
      reviewCount,
    });
  }

  /**
   * Generate individual Review schema markup
   */
  generateReviewMarkup(reviews, productName) {
    return reviews.map(review => schemaGenerator.generateReviewSchema({
      itemName: productName,
      itemType: 'Product',
      ratingValue: review.rating,
      authorName: review.author,
      reviewBody: review.body,
      datePublished: review.date,
    }));
  }

  /**
   * Suggest a review collection strategy to boost SEO signals
   */
  getReviewStrategy(auditResults) {
    const strategies = [];

    // Products with 0 reviews — highest priority
    const noReviews = auditResults.products.filter(p => !p.has_reviews);
    if (noReviews.length > 0) {
      strategies.push({
        priority: 'high',
        action: 'Collect first reviews for products with zero reviews',
        products_affected: noReviews.length,
        tactics: [
          'Send post-purchase email 7-14 days after delivery asking for a review',
          'Offer loyalty points or a small discount for leaving a review',
          'Make the review form dead simple — star rating + one text field',
          'Start with your best-selling products to maximize impact',
        ],
        seo_impact: 'Products with reviews get higher CTR in search results. Even 1-2 reviews helps.',
      });
    }

    // Products with reviews but likely no schema
    const withReviews = auditResults.products.filter(p => p.has_reviews && !p.has_review_schema);
    if (withReviews.length > 0) {
      strategies.push({
        priority: 'high',
        action: 'Add Product schema with aggregateRating to product pages',
        products_affected: withReviews.length,
        tactics: [
          'Add JSON-LD Product schema with aggregateRating to each product page',
          'Use this bot\'s /api/schema/product endpoint to generate the markup',
          'Verify with Google Rich Results Test after implementation',
        ],
        seo_impact: 'Star ratings in search results increase CTR by 15-30%.',
      });
    }

    // UGC content strategy
    strategies.push({
      priority: 'medium',
      action: 'Turn reviews into SEO content',
      tactics: [
        'Create "customer stories" blog posts featuring detailed reviews',
        'Add a testimonials/reviews section to landing pages',
        'Pull review quotes into product descriptions for fresh UGC content',
        'Use customer questions from reviews as FAQ content',
      ],
      seo_impact: 'UGC adds fresh, keyword-rich content that Google values. Customers use natural language that matches search queries.',
    });

    // Social proof for GEO
    strategies.push({
      priority: 'medium',
      action: 'Reviews as GEO signals (AI search optimization)',
      tactics: [
        'High review counts and ratings make AI engines more likely to recommend your products',
        'Encourage detailed reviews that mention specific use cases — AI extracts these',
        'Respond to reviews publicly — shows engagement and adds context for AI crawlers',
        'Aim for reviews on third-party sites too (Google Reviews, Trustpilot) — AI cross-references',
      ],
      seo_impact: 'AI search engines cite brands with strong social proof signals more frequently.',
    });

    return strategies;
  }

  // ==================== Private helpers ====================

  async _getReviewMetafields(productId) {
    if (!shopify.isConfigured()) return [];
    try {
      return await shopify.getMetafields('products', productId);
    } catch {
      return [];
    }
  }

  _extractReviewData(metafields) {
    // Try to find review data from common review app metafield namespaces
    const result = { count: 0, rating: 0 };

    for (const mf of metafields) {
      // Yotpo, Judge.me, Stamped, Loox all use variations of these
      if (mf.key === 'reviews_count' || mf.key === 'review_count' || mf.key === 'count') {
        result.count = parseInt(mf.value, 10) || 0;
      }
      if (mf.key === 'reviews_average' || mf.key === 'rating' || mf.key === 'average_rating') {
        result.rating = parseFloat(mf.value) || 0;
      }
    }

    return result;
  }

  _identifyReviewOpportunities(product, reviewData) {
    const opportunities = [];

    if (reviewData.count === 0) {
      opportunities.push({
        type: 'collect_reviews',
        message: 'No reviews found. Collecting even 3-5 reviews enables star ratings in search results.',
      });
    }

    if (reviewData.count > 0 && reviewData.count < 10) {
      opportunities.push({
        type: 'grow_reviews',
        message: `Only ${reviewData.count} reviews. Aim for 10+ to build strong social proof signals.`,
      });
    }

    if (reviewData.rating > 0 && reviewData.rating >= 4.0) {
      opportunities.push({
        type: 'add_schema',
        message: `Good rating (${reviewData.rating}/5). Add Product schema with aggregateRating to show stars in search results.`,
      });
    }

    return opportunities;
  }
}

module.exports = new ReviewSEO();
