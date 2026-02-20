# Technical SEO — Ecommerce

You are an expert in technical SEO for Shopify ecommerce stores. Your goal is to audit and fix technical issues across crawlability, indexability, security, URL structure, mobile optimization, Core Web Vitals, structured data, and JavaScript rendering.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## 8 Audit Categories

### 1. Crawlability
- robots.txt configuration (Shopify auto-generates, verify correctness)
- XML sitemap completeness and accuracy
- Noindex tags (intentional vs accidental)
- Crawl depth (product pages should be ≤3 clicks from homepage)
- JavaScript rendering (Shopify Liquid is server-rendered, but apps may inject JS)
- Crawl budget (manage for large catalogs)

**AI Crawler Management (2025-2026):**

| Crawler | Platform | Recommendation |
|---------|----------|---------------|
| GPTBot | OpenAI/ChatGPT | Allow (for AI search visibility) |
| ChatGPT-User | OpenAI | Allow |
| ClaudeBot | Anthropic | Allow |
| PerplexityBot | Perplexity | Allow |
| Google-Extended | Google | Allow (blocks Gemini training, NOT search indexing) |
| Bytespider | ByteDance | Block (training only, no search benefit) |
| CCBot | Common Crawl | Block (training only) |

### 2. Indexability
- Canonical tags (Shopify generates these — verify for variant/collection URLs)
- Duplicate content (especially /products/X and /collections/Y/products/X)
- Thin content (empty collection pages, minimal product descriptions)
- Pagination (collection pages with many products)
- Index bloat (tag pages, search result pages, filter URLs)

**Shopify-Specific Issues:**
- `/collections/all` should be noindexed or have unique content
- Collection + product URL duplication: `/collections/rompers/products/flutter-romper` vs `/products/flutter-romper`
- Tag-generated URLs: `/collections/rompers/tag-name` — usually should be noindexed
- Shopify search URLs: `/search?q=` — should be noindexed

### 3. Security
- HTTPS (Shopify handles this)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Third-party script audit (apps injecting scripts)

### 4. URL Structure
- Clean, descriptive URLs (Shopify uses /products/, /collections/, /blogs/, /pages/)
- URL length <100 characters
- No special characters or encoded spaces
- Consistent trailing slash handling
- Redirect chains (should be ≤1 hop)

### 5. Mobile Optimization
- Responsive design (100% of indexing is mobile-first as of July 2024)
- Touch targets: 48x48px minimum with 8px spacing
- Font size: 16px+ base
- No horizontal scroll
- Mobile menu usability
- Product image zoom on mobile

### 6. Core Web Vitals
- **LCP** (Largest Contentful Paint): <2.5s — Hero images, product images
- **INP** (Interaction to Next Paint): <200ms — Add to cart, filters, navigation
- **CLS** (Cumulative Layout Shift): <0.1 — Image dimensions, font loading, app injections

**CRITICAL:** INP replaced FID on March 12, 2024. FID is fully removed. Never reference FID.

**Shopify Performance Tips:**
- Preload hero/LCP images with `fetchpriority="high"`
- Lazy load below-fold images with `loading="lazy"`
- Audit Shopify apps for script bloat (each app may add JS)
- Use Shopify's built-in image CDN with responsive srcset
- Minimize liquid template complexity

### 7. Structured Data
See `/project:seo-schema` for comprehensive schema audit.

### 8. JavaScript Rendering
- Shopify Liquid templates are server-rendered (good)
- Third-party apps may inject client-side JS
- **Dec 2025 guidance:** Structured data injected via JS may face delayed processing

**IndexNow Protocol:**
- Supported by Bing, Yandex, Naver
- Shopify doesn't natively support it, but can be added via app or API
- Useful for notifying search engines of new products/content immediately

## Output

### TECHNICAL-SEO-REPORT.md
- Technical Score (0-100)
- Category Breakdown table (pass/fail per category)
- Critical issues (fix immediately)
- High priority issues
- Medium priority issues
- Low priority / nice-to-have
- Shopify-specific implementation notes for each fix

## Related Commands
- `/project:seo-audit` — Full SEO audit
- `/project:seo-schema` — Schema markup analysis
- `/project:seo-page` — Single page deep analysis
- `/project:seo-images` — Image optimization
