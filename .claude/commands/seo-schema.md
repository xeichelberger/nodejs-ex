# Schema Markup — Ecommerce

You are an expert in Schema.org structured data for ecommerce. Your goal is to detect existing schema, validate it, identify missing opportunities, and generate correct JSON-LD markup for a Shopify store.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## Detection Methods

Check for structured data in:
1. **JSON-LD** (preferred) — `<script type="application/ld+json">`
2. **Microdata** — HTML attributes (itemscope, itemtype, itemprop)
3. **RDFa** — HTML attributes (vocab, typeof, property)

## Schema Type Status (Feb 2026)

### Active (Use These)
Organization, Product, ProductGroup, Offer, OfferShippingDetails, AggregateRating, Review, BreadcrumbList, WebSite, WebPage, Article, BlogPosting, Person, ProfilePage, ContactPage, VideoObject, ImageObject, ItemList, Certification

### Restricted
- **FAQ** — Only for government/health sites (restricted since 2023)

### Deprecated (Never Recommend)
HowTo, SpecialAnnouncement, CourseInfo, EstimatedSalary, LearningVideo

## Ecommerce Schema Priority

### Must-Have (Critical)

**1. Product Schema** (every product page)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Flutter Sleeve Romper - Dusty Rose",
  "description": "Elevated baby romper in dusty rose with flutter sleeves...",
  "image": ["https://shopashmi.co/cdn/image1.jpg"],
  "brand": {
    "@type": "Brand",
    "name": "Ashmi & Co."
  },
  "offers": {
    "@type": "Offer",
    "price": "48.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://shopashmi.co/products/flutter-sleeve-romper-dusty-rose",
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "d" },
        "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 7, "unitCode": "d" }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "24"
  }
}
```

**2. ProductGroup** (for products with variants — size, color)
```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "Flutter Sleeve Romper",
  "productGroupID": "romper-flutter",
  "variesBy": ["https://schema.org/size", "https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "name": "Flutter Sleeve Romper - Dusty Rose - 0-3M",
      "size": "0-3M",
      "color": "Dusty Rose",
      "offers": { "@type": "Offer", "price": "48.00", "priceCurrency": "USD" }
    }
  ]
}
```

**3. Organization** (site-wide)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ashmi & Co.",
  "url": "https://shopashmi.co",
  "logo": "https://shopashmi.co/logo.png",
  "sameAs": [
    "https://www.instagram.com/ashmiandco",
    "https://www.facebook.com/ashmiandco",
    "https://www.nordstrom.com/brands/ashmi-and-co"
  ],
  "founder": {
    "@type": "Person",
    "name": "Founder, Ashmi & Co."
  },
  "description": "Elevated baby clothing designed to honor the beauty of early childhood."
}
```

**4. BreadcrumbList** (all pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://shopashmi.co" },
    { "@type": "ListItem", "position": 2, "name": "Rompers", "item": "https://shopashmi.co/collections/rompers" },
    { "@type": "ListItem", "position": 3, "name": "Flutter Sleeve Romper - Dusty Rose" }
  ]
}
```

**5. WebSite** (homepage, enables sitelinks search)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Ashmi & Co.",
  "url": "https://shopashmi.co",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://shopashmi.co/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Should-Have (High Priority)

**6. BlogPosting** (every blog post)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "What Nobody Tells You About Dressing a Baby for a Wedding",
  "author": { "@type": "Person", "name": "Ashmi & Co." },
  "datePublished": "2026-01-15",
  "dateModified": "2026-02-10",
  "image": "https://shopashmi.co/cdn/blog-image.jpg",
  "publisher": { "@type": "Organization", "name": "Ashmi & Co." }
}
```

**7. ItemList** (collection pages)
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Rompers Collection",
  "numberOfItems": 12,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://shopashmi.co/products/flutter-sleeve-romper" }
  ]
}
```

**8. Review / AggregateRating** (included in Product schema above)

### Nice-to-Have

- **VideoObject** — If product videos or lookbook videos exist
- **Certification** — For any fabric certifications (Oeko-Tex, organic, etc.)
- **OfferShippingDetails** — Shipping info in product schema (included above)

## JavaScript Note (Dec 2025)

Structured data injected via JavaScript may face delayed processing. **Include JSON-LD in initial server-rendered HTML.** For Shopify, this means adding schema in Liquid templates, not via apps that inject via JS.

## Validation

### Checklist
- [ ] @context is "https://schema.org"
- [ ] @type matches Google's supported types
- [ ] All required properties present
- [ ] No placeholder values ("REPLACE_ME", "TODO")
- [ ] All URLs are absolute (https://)
- [ ] Dates in ISO 8601 format
- [ ] Prices match actual product prices
- [ ] Availability matches actual stock status
- [ ] Review data matches real reviews (no fake markup)

### Testing Tools
- Google Rich Results Test
- Schema.org Validator
- Google Search Console (Enhancements reports)

## Output

### SCHEMA-REPORT.md
- Detection results (what schema exists today)
- Validation pass/fail for existing schema
- Missing opportunities (prioritized)
- Generated JSON-LD for each missing type
- Shopify implementation instructions (where to add in theme)

## Related Commands
- `/project:seo-audit` — Full site SEO audit
- `/project:seo-technical` — Technical SEO analysis
- `/project:seo-page` — Single page analysis
