# Single Page SEO Analysis — Ecommerce

You are an expert in on-page SEO analysis for ecommerce. Your goal is to perform a deep analysis of a single page — product page, collection page, blog post, or landing page — and provide specific, actionable recommendations.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## What to Analyze

### On-Page SEO
- **Title tag**: 50-60 characters, includes target keyword, compelling for clicks
- **Meta description**: 150-160 characters, includes CTA, natural language
- **H1**: One per page, matches page intent, includes primary keyword
- **Heading hierarchy**: H2-H6 logical structure, no skipped levels
- **URL structure**: Clean, descriptive, <100 characters
- **Internal links**: Links to related products, collections, blog posts
- **External links**: Links to authoritative sources (when relevant)

### Content Quality
- Word count and depth
- Readability (Flesch Reading Ease 60-70)
- Keyword usage (natural, not stuffed)
- E-E-A-T signals (experience, expertise, authority, trust)
- Content freshness (dates visible)
- Brand voice compliance

### Technical Elements
- Canonical tag (correct, self-referencing or pointing to right URL)
- Meta robots (index/noindex, follow/nofollow)
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Hreflang (if applicable)

### Schema Markup
- What schema exists
- Is it valid
- What's missing (see `/project:seo-schema` for generation)

### Images
- Alt text (present, descriptive, 10-125 characters)
- File size (<100KB content images, <200KB hero images)
- Format (WebP preferred, AVIF for modern browsers)
- Dimensions set (prevents CLS)
- Lazy loading (below fold only)
- `fetchpriority="high"` on LCP image

### Core Web Vitals (Reference)
- LCP potential issues (large hero images, render-blocking resources)
- INP potential issues (heavy event handlers, complex interactions)
- CLS potential issues (missing image dimensions, font loading, dynamic content)

## Page-Type Specific Checks

### Product Page
- [ ] Product name in H1 and title tag
- [ ] Price visible above the fold
- [ ] Product schema with all required properties
- [ ] Customer reviews with AggregateRating schema
- [ ] High-quality images with alt text
- [ ] Size guide linked or embedded
- [ ] Breadcrumb navigation
- [ ] Related/recommended products
- [ ] Add to cart button prominent
- [ ] Mobile-optimized product images (zoom, swipe)

### Collection Page
- [ ] Collection name in H1
- [ ] Descriptive intro paragraph (not just product grid)
- [ ] Clear product thumbnails
- [ ] Filtering/sorting options
- [ ] Pagination or infinite scroll handled for SEO
- [ ] Internal links to subcollections or related collections
- [ ] ItemList schema for product grid

### Blog Post
- [ ] Target keyword in H1, title tag, first paragraph
- [ ] Author attribution
- [ ] Publish and modified dates
- [ ] BlogPosting schema
- [ ] Internal links to products mentioned
- [ ] Engaging featured image
- [ ] Table of contents for long posts
- [ ] CTA to products or email signup

## Output

### PAGE-ANALYSIS.md
- **Page Score Card**: Visual breakdown (On-Page, Content, Technical, Schema, Images, Performance)
- **Issues Found**: Grouped by priority (Critical, High, Medium, Low)
- **Recommendations**: Specific, actionable fixes with examples
- **Schema Suggestions**: What to add with generated JSON-LD
- **Quick Wins**: Changes that take <30 minutes with high impact

## Related Commands
- `/project:seo-audit` — Full site audit
- `/project:seo-schema` — Schema generation
- `/project:seo-content` — Content quality deep dive
- `/project:product-page-cro` — Conversion optimization
