# Ashmi & Co. -- Recommended Site Architecture

**Last Updated:** February 2026
**Site:** shopashmi.co (Shopify)

---

## Current Site Structure (Problems Identified)

Based on research of the live site, the current URL structure has several SEO issues:

### Current Collections
```
/collections/frontpage         (default Shopify -- should not be indexed)
/collections/clothing          (too broad, no keyword targeting)
/collections/girl-clothing     (decent but meta description is generic)
/collections/boy-clothing      (decent but meta description is generic)
/collections/unisex            (good)
/collections/sets              (good)
/collections/new-arrivals      (good)
/collections/all               (paginated -- /collections/all?page=2 is indexed)
```

### Current Pages
```
/pages/wholesale
/pages/faq
/pages/about-us
/pages/is-ashmi-co-a-real-company    (trust page -- good intent, poor URL)
```

### Current Blog
```
/blogs/ashmi-mommas/                 (sparse content)
/blogs/ashmi-mommas/tagged/black-owned-brands
```

### Current Products (sample)
```
/products/lizzie-flutter-romper
/products/rumi-romper
/products/isabella-ruffle-romper
/products/falyn-dress
/products/dallas-overalls
/products/ashmi-signature-set
```

### Key Problems
1. **No product-type collections** -- no /collections/rompers, /collections/dresses, /collections/overalls
2. **No occasion-based collections** -- despite "occasion-ready" being core brand positioning
3. **Generic meta descriptions** -- the same boilerplate text appears on multiple collection pages
4. **"All Products" pagination indexed** -- /collections/all?page=2 should not be a primary indexed page
5. **Missing gift infrastructure** -- no gift guide, no gift sets collection
6. **Blog is underutilized** -- minimal content, no keyword-targeted posts
7. **Trust page URL is poor** -- "/is-ashmi-co-a-real-company" should be "/about" or integrated into About page
8. **No seasonal or holiday collections** -- missing opportunity for seasonal keyword capture

---

## Recommended URL Architecture

### Principles
1. **Flat structure** -- keep URLs 3 levels deep maximum (domain/type/slug)
2. **Keyword-rich slugs** -- every collection URL should contain a target keyword
3. **Logical hierarchy** -- organize by how parents actually shop (occasion, product type, gender, age)
4. **Canonical strategy** -- use canonical tags to avoid duplicate content across overlapping collections
5. **Breadcrumb schema** -- implement breadcrumb structured data for every page

---

### COLLECTIONS (Product Listings)

#### By Product Type (Primary Navigation)
```
/collections/rompers                     -- "Baby Rompers | Premium Flutter, Ruffle & Knit Styles"
/collections/dresses                     -- "Baby Dresses | Elegant Occasion & Everyday Styles"
/collections/sets                        -- "Baby Clothing Sets | Coordinated Outfit Sets"
/collections/overalls                    -- "Baby Overalls | Knit & Cotton Styles"
/collections/leggings                    -- "Baby Leggings & Pants | Soft Premium Basics"
/collections/outerwear                   -- "Baby Outerwear | Sweaters, Jackets & Cozy Layers"
/collections/accessories                 -- "Baby Accessories | Turbans, Headbands & Tights"
```

#### By Gender
```
/collections/baby-girl                   -- "Baby Girl Clothes | Premium Dresses, Rompers & Sets"
/collections/baby-boy                    -- "Baby Boy Clothes | Premium Rompers, Sets & Overalls"
/collections/unisex                      -- "Unisex Baby Clothes | Gender Neutral Outfits"
```

Note: Change /collections/girl-clothing to /collections/baby-girl and /collections/boy-clothing to /collections/baby-boy for better keyword targeting. Set up 301 redirects from old URLs.

#### By Occasion (NEW -- High Priority)
```
/collections/special-occasion            -- "Special Occasion Baby Outfits | Weddings, Christenings & More"
/collections/everyday                    -- "Everyday Baby Clothes | Comfortable Premium Basics"
/collections/holiday                     -- "Holiday Baby Outfits | Seasonal Styles for Every Celebration"
/collections/photo-ready                 -- "Photo-Ready Baby Outfits | Family Photos & Portraits"
```

#### By Shopping Intent
```
/collections/new-arrivals                -- "New Arrivals | Latest Baby Clothing from Ashmi & Co."
/collections/best-sellers                -- "Best Sellers | Our Most Popular Baby Outfits"
/collections/gift-sets                   -- "Baby Gift Sets | Premium Curated Gift Bundles"
/collections/sale                        -- "Sale | Baby Clothing on Sale"
```

#### Seasonal Collections (Rotate Throughout Year)
```
/collections/spring                      -- "Spring Baby Clothes | Fresh Styles for Warm Days"
/collections/summer                      -- "Summer Baby Clothes | Light & Breezy Outfits"
/collections/fall                        -- "Fall Baby Clothes | Cozy Knits & Warm Layers"
/collections/winter                      -- "Winter Baby Clothes | Warm & Snuggly Outfits"
```

---

### PRODUCTS

Keep the current flat product URL structure. It works well for Shopify SEO:

```
/products/[product-slug]
```

#### Product URL Naming Conventions
- Include the product name and category in the slug
- Use hyphens, not underscores
- Keep slugs under 60 characters
- Include color only if it differentiates variants that have separate pages

**Good examples:**
```
/products/lizzie-flutter-romper          (already good)
/products/isabella-ruffle-romper         (already good)
/products/falyn-dress                    (could be improved to /products/falyn-flutter-dress)
/products/dallas-overalls                (already good)
```

**Product URL improvements needed:**
- Ensure every product slug contains the product type (romper, dress, set, overalls)
- Do not use SKU numbers or internal codes in URLs
- If a product has a generic name, append the category: e.g., /products/rumi-knit-romper instead of /products/rumi-romper

---

### PAGES (Non-Product Content)

```
/pages/about                             -- "About Ashmi & Co. | Black-Owned Premium Baby Clothing"
/pages/our-story                         -- "Our Story | Founded by a Mom, Designed in Georgia"
/pages/gift-guide                        -- "Baby Gift Guide | Premium Clothing Gifts for Every Occasion"
/pages/size-guide                        -- "Baby Size Guide | Find the Perfect Fit"
/pages/faq                               -- "FAQs | Shipping, Returns & Sizing"
/pages/wholesale                         -- "Wholesale Baby Clothing | Partner with Ashmi & Co."
/pages/where-to-shop                     -- "Where to Shop Ashmi & Co. | Nordstrom, Maisonette & More"
/pages/our-fabrics                       -- "Our Fabrics | Premium Materials & Quality Standards"
/pages/contact                           -- "Contact Ashmi & Co. | Customer Support"
```

**Pages to Remove or Redirect:**
- `/pages/is-ashmi-co-a-real-company` -- 301 redirect to `/pages/about` (consolidate trust signals into About page)

---

### BLOG

```
/blogs/journal                           -- Main blog hub (rename from /blogs/ashmi-mommas for broader appeal)
/blogs/journal/[post-slug]               -- Individual blog posts
/blogs/journal/tagged/[tag-slug]         -- Tag pages (use sparingly, noindex if thin)
```

Note: If changing the blog handle from "ashmi-mommas" to "journal" is not feasible on Shopify without losing existing URLs, keep "ashmi-mommas" but set up a 301 redirect from any old URLs if changed.

#### Blog Post URL Conventions
- Slug should contain the primary target keyword
- Keep slugs under 75 characters
- Use hyphens, not underscores
- Do not include dates in URLs (evergreen content should not look dated)

**Good blog URL examples:**
```
/blogs/journal/what-to-dress-baby-in-for-wedding
/blogs/journal/best-premium-baby-clothing-brands
/blogs/journal/baby-christening-outfit-guide
/blogs/journal/first-birthday-outfit-ideas
/blogs/journal/how-to-build-baby-capsule-wardrobe
/blogs/journal/family-photo-outfits-for-baby
/blogs/journal/black-owned-baby-clothing-brands-to-support
```

---

## NAVIGATION STRUCTURE

### Primary Navigation (Header)

```
Shop                              -- Mega menu dropdown
  |-- New Arrivals                (/collections/new-arrivals)
  |-- Best Sellers                (/collections/best-sellers)
  |-- By Category
  |     |-- Rompers               (/collections/rompers)
  |     |-- Dresses               (/collections/dresses)
  |     |-- Sets                  (/collections/sets)
  |     |-- Overalls              (/collections/overalls)
  |     |-- Leggings & Pants      (/collections/leggings)
  |     |-- Outerwear             (/collections/outerwear)
  |     |-- Accessories           (/collections/accessories)
  |-- By Gender
  |     |-- Girl                  (/collections/baby-girl)
  |     |-- Boy                   (/collections/baby-boy)
  |     |-- Unisex                (/collections/unisex)
  |-- Shop by Occasion
  |     |-- Everyday              (/collections/everyday)
  |     |-- Special Occasion      (/collections/special-occasion)
  |     |-- Holiday               (/collections/holiday)
  |     |-- Photo Ready           (/collections/photo-ready)
  |-- Gift Sets                   (/collections/gift-sets)
  |-- Sale                        (/collections/sale)

Our Story                         (/pages/about)
Journal                           (/blogs/journal)
Gift Guide                        (/pages/gift-guide)
```

### Footer Navigation

```
Column 1: Shop
  - New Arrivals
  - Best Sellers
  - Rompers
  - Dresses
  - Sets
  - Sale

Column 2: Help
  - Size Guide
  - FAQs
  - Shipping & Returns
  - Contact Us

Column 3: About
  - Our Story
  - Our Fabrics
  - Where to Shop
  - Wholesale
  - Journal

Column 4: Community
  - Instagram (@shopashmi)
  - TikTok
  - Pinterest
  - Email Signup
```

---

## TECHNICAL SEO REQUIREMENTS

### Canonical Tags
Every page must have a self-referencing canonical tag. For products that appear in multiple collections, the canonical should always point to the primary `/products/[slug]` URL, never the collection-filtered version.

```html
<!-- On /products/lizzie-flutter-romper -->
<link rel="canonical" href="https://shopashmi.co/products/lizzie-flutter-romper" />

<!-- On /collections/rompers?page=2 -->
<link rel="canonical" href="https://shopashmi.co/collections/rompers?page=2" />
```

### Robots.txt Recommendations
```
User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /checkout
Disallow: /orders
Disallow: /account
Disallow: /collections/*?*sort_by*
Disallow: /collections/*?*+*
Disallow: /search
Disallow: /collections/frontpage
Allow: /collections/*
Allow: /products/*
Allow: /blogs/*
Allow: /pages/*
Sitemap: https://shopashmi.co/sitemap.xml
```

### Sitemap
Shopify auto-generates sitemaps. Verify that:
1. All new collections appear in the sitemap
2. No duplicate or thin pages are included
3. Blog posts are properly included
4. Submit sitemap to Google Search Console and Bing Webmaster Tools

### Structured Data (Schema.org)

**Required on every product page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Lizzie Flutter Romper",
  "description": "Premium flutter sleeve baby romper in dusty rose...",
  "brand": {
    "@type": "Brand",
    "name": "Ashmi & Co."
  },
  "offers": {
    "@type": "Offer",
    "price": "48.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://shopashmi.co/products/lizzie-flutter-romper"
  },
  "image": "https://shopashmi.co/cdn/shop/...",
  "sku": "LIZZIE-FLUTTER-ROMPER",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "25"
  }
}
```

**Required on the homepage:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ashmi & Co.",
  "url": "https://shopashmi.co",
  "logo": "https://shopashmi.co/cdn/shop/files/logo.png",
  "description": "Premium baby clothing designed in the USA. Black-owned, women-founded.",
  "founder": {
    "@type": "Person",
    "name": "Uyo Okebie-Eichelberger"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Roswell",
    "addressRegion": "GA",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://www.instagram.com/shopashmi/",
    "https://www.nordstrom.com/brands/ashmi-co--24001",
    "https://www.maisonette.com/brands/ashmi-co"
  ]
}
```

**Required on collection pages:**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Baby Rompers",
  "description": "Premium baby rompers in flutter, ruffle, and knit styles...",
  "url": "https://shopashmi.co/collections/rompers"
}
```

**Required on blog posts:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What to Dress Baby In for a Wedding: Complete Guide",
  "author": {
    "@type": "Organization",
    "name": "Ashmi & Co."
  },
  "datePublished": "2026-03-01",
  "dateModified": "2026-03-01",
  "publisher": {
    "@type": "Organization",
    "name": "Ashmi & Co."
  }
}
```

**Breadcrumbs (all pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://shopashmi.co"},
    {"@type": "ListItem", "position": 2, "name": "Rompers", "item": "https://shopashmi.co/collections/rompers"},
    {"@type": "ListItem", "position": 3, "name": "Lizzie Flutter Romper"}
  ]
}
```

### FAQ Schema (on FAQ page and relevant blog posts)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What sizes does Ashmi & Co. carry?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We carry sizes from newborn (0-3 months) through 24 months..."
      }
    }
  ]
}
```

---

## PAGE TITLE & META DESCRIPTION TEMPLATES

### Homepage
```
Title: Ashmi & Co. | Premium Baby Clothing | Designed in USA
Meta: Luxuriously styled baby clothes for 0-24 months. Premium rompers, dresses & sets. Black-owned, designed in Georgia. Free shipping on orders $75+.
```

### Collection Pages
```
Title: [Collection Name] | Baby [Product Type] | Ashmi & Co.
Meta: Shop [collection name] from Ashmi & Co. [Unique selling point]. Premium fabrics, designed in the USA. Sizes 0-24 months. [CTA].

Example:
Title: Baby Rompers | Flutter Sleeve, Ruffle & Knit Styles | Ashmi & Co.
Meta: Shop premium baby rompers from Ashmi & Co. Flutter sleeves, ruffle details & cozy knits in dusty rose, sage, cream & more. Sizes 0-24 months. Free shipping $75+.
```

### Product Pages
```
Title: [Product Name] | [Product Type] | Ashmi & Co.
Meta: [Product Name] - [key feature/fabric]. [1-2 sentence description]. Sizes [range]. Designed in USA, ships from Roswell, GA. [Price].

Example:
Title: Lizzie Flutter Romper | Baby Girl Romper | Ashmi & Co.
Meta: The Lizzie Flutter Romper features delicate flutter sleeves in premium fabric. Perfect for special occasions & everyday elegance. Sizes 0-24 months. $48.
```

### Blog Posts
```
Title: [Primary Keyword] | [Secondary Angle] | Ashmi & Co.
Meta: [Answer the search query in 1 sentence]. [What the reader will learn/get]. [Brand context if relevant].

Example:
Title: What to Dress Baby in for a Wedding | Complete Outfit Guide | Ashmi & Co.
Meta: Find the perfect baby wedding outfit with our complete guide. Tips for formal & casual ceremonies, plus our top picks for boys & girls. Read now.
```

---

## INTERNAL LINKING STRATEGY

### Collection-to-Collection
- Each collection page should link to 2-3 related collections in body copy
- Example: The Rompers collection page should have a sentence like "Looking for a complete outfit? Browse our coordinated [Sets](/collections/sets) or add a [Turban Headband](/collections/accessories) to complete the look."

### Product-to-Product
- Every product page should show "You May Also Like" with 4 products from the same or adjacent collection
- Every product page should show "Complete the Look" with accessories or complementary items
- Product descriptions should link to the relevant collection: "Part of our [Special Occasion](/collections/special-occasion) collection."

### Blog-to-Collection & Blog-to-Product
- Every blog post should link to at least 2 collection pages and 2-3 specific products
- Use contextual anchor text matching target keywords: "our [dusty rose flutter romper](/products/lizzie-flutter-romper)" instead of "click here"

### Collection-to-Blog
- Each collection page should link to 1-2 relevant blog posts
- Example: Special Occasion collection links to "Read our guide: [What to Dress Baby in for a Wedding](/blogs/journal/what-to-dress-baby-in-for-wedding)"

---

## REDIRECT MAP (Immediate Actions)

| Old URL | New URL | Type |
|---------|---------|------|
| /collections/girl-clothing | /collections/baby-girl | 301 |
| /collections/boy-clothing | /collections/baby-boy | 301 |
| /pages/is-ashmi-co-a-real-company | /pages/about | 301 |
| /collections/clothing | /collections/rompers (or keep as "all clothing" parent) | 301 or keep |
| /collections/frontpage | (noindex, do not redirect, remove from nav) | noindex |

---

## PRIORITY ORDER FOR IMPLEMENTATION

**Week 1-2: Critical**
1. Create /collections/rompers
2. Create /collections/dresses
3. Create /collections/special-occasion
4. Optimize all existing collection meta titles and descriptions
5. Add Product structured data to all product pages
6. Add Organization schema to homepage
7. Set up 301 redirects

**Week 3-4: Important**
8. Create /collections/best-sellers
9. Create /collections/gift-sets
10. Create /pages/gift-guide
11. Create /pages/size-guide (or optimize existing one)
12. Update navigation structure
13. Add breadcrumb schema

**Week 5-8: Growth**
14. Create /collections/overalls
15. Create /collections/leggings
16. Create /collections/outerwear
17. Create /collections/accessories
18. Create /collections/photo-ready
19. Create seasonal collection pages
20. Publish first 4-6 blog posts with full internal linking

**Week 9-12: Refinement**
21. Create /collections/everyday
22. Create /collections/holiday
23. Create /pages/our-fabrics
24. Create /pages/where-to-shop
25. Continue blog content expansion
26. Audit and fix any internal linking gaps
