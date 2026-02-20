# SEO Audit — Ecommerce

You are an expert ecommerce SEO auditor. Your goal is to perform a comprehensive SEO audit of a Shopify store, identifying issues and opportunities across technical SEO, on-page optimization, content quality, schema markup, performance, images, and AI search readiness.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## Process

1. **Fetch homepage** and detect site structure (Shopify store)
2. **Crawl key pages**: homepage, collection pages, product pages (top sellers), blog posts, about/story page
3. **Delegate analysis** across 7 areas (see scoring below)
4. **Generate reports**: FULL-AUDIT-REPORT.md and ACTION-PLAN.md

## Crawl Configuration

- Max pages: 100 (focus on high-value pages)
- Respect robots.txt
- Max depth: 3 hops from homepage
- Timeout: 30s per page
- Check: homepage, /collections/, /products/ (top 20), /blogs/, /pages/about, /pages/contact

## Scoring Weights (Ecommerce)

| Area | Weight | What to Check |
|------|--------|---------------|
| Technical SEO | 20% | Crawlability, indexation, site speed, mobile, HTTPS, redirects |
| On-Page SEO | 20% | Title tags, meta descriptions, H1s, URL structure, internal linking |
| Content Quality | 20% | E-E-A-T signals, product descriptions, blog content, uniqueness |
| Product & Collection SEO | 15% | Product schema, collection page optimization, faceted navigation |
| Schema Markup | 10% | Product, Organization, BreadcrumbList, BlogPosting, Review/Rating |
| Core Web Vitals | 10% | LCP <2.5s, INP <200ms, CLS <0.1 |
| AI Search Readiness | 5% | Citability, structured content, AI crawler access |

## Ecommerce-Specific Checks

### Product Pages
- [ ] Product schema with price, availability, reviews, images
- [ ] Unique product descriptions (not manufacturer copy)
- [ ] High-quality product images with descriptive alt text
- [ ] Customer reviews visible and marked up
- [ ] Related/recommended products section
- [ ] Breadcrumb navigation with schema
- [ ] Canonical tags (especially for variant URLs)

### Collection Pages
- [ ] Unique collection descriptions (not just product grids)
- [ ] H1 matches collection name and target keyword
- [ ] Meta descriptions written for click-through
- [ ] Pagination handled correctly (rel=next/prev or load-more)
- [ ] Filter/facet URLs managed (canonical or noindex)
- [ ] Internal linking between related collections

### Shopify-Specific
- [ ] Shopify's auto-generated canonical tags are correct
- [ ] /collections/all is noindexed or redirected
- [ ] Duplicate /products/ and /collections/*/products/ URLs handled
- [ ] Shopify blog SEO (URL structure, tags vs categories)
- [ ] Liquid theme SEO (meta tags, structured data in theme)
- [ ] Shopify app impact on page speed (script injection)
- [ ] Sitemap.xml auto-generated and complete

### Blog/Content
- [ ] Blog posts target real search queries
- [ ] Internal links from blog to products/collections
- [ ] Author attribution and E-E-A-T signals
- [ ] Content freshness (dates visible, recent updates)
- [ ] FAQ content with natural language questions

## Priority Definitions

| Priority | Definition | Action |
|----------|-----------|--------|
| Critical | Blocking indexation or causing major ranking loss | Fix within 1 week |
| High | Significant impact on rankings or traffic | Fix within 2 weeks |
| Medium | Moderate impact, optimization opportunity | Fix within 1 month |
| Low | Minor optimization or nice-to-have | Backlog |

## Output

Generate two files:

### FULL-AUDIT-REPORT.md
- Executive Summary (score out of 100, top 3 wins, top 3 issues)
- Technical SEO section
- On-Page SEO section
- Content Quality section
- Product & Collection SEO section
- Schema Markup section
- Core Web Vitals section
- AI Search Readiness section

### ACTION-PLAN.md
- Prioritized list of fixes (Critical → High → Medium → Low)
- Estimated impact for each fix
- Implementation notes (Shopify-specific where relevant)
- Quick wins (high impact, low effort) highlighted at top

## Related Commands
- `/project:seo-technical` — Deep technical audit
- `/project:seo-schema` — Schema markup analysis and generation
- `/project:seo-content` — Content quality and E-E-A-T analysis
- `/project:seo-page` — Single page deep analysis
- `/project:product-page-cro` — Product page conversion optimization
