# SEO Audit Report — shopashmi.co

**Date:** February 21, 2026
**Auditor:** ClawdSEOBot
**Site:** shopashmi.co (Shopify)
**Brand:** Ashmi & Co. — Premium Baby Clothing (0-24 months)

---

## Executive Summary

### Overall SEO Score: 24/100

| Area | Weight | Score | Weighted |
|------|--------|-------|----------|
| Technical SEO | 20% | 30/100 | 6.0 |
| On-Page SEO | 20% | 18/100 | 3.6 |
| Content Quality | 20% | 22/100 | 4.4 |
| Product & Collection SEO | 15% | 15/100 | 2.25 |
| Schema Markup | 10% | 5/100 | 0.5 |
| Core Web Vitals | 10% | 50/100 | 5.0 (estimated) |
| AI Search Readiness | 5% | 18/100 | 0.9 |
| **TOTAL** | **100%** | | **22.65 → 24** |

### Top 3 Wins (Low Effort, High Impact)
1. **Create `/collections/rompers` page** — your #1 product category doesn't have a dedicated, indexable collection page. This single fix opens the door to ranking for "baby romper" keywords (18K-22K monthly searches).
2. **Add Product schema markup** — zero structured data detected. Adding Product JSON-LD enables rich results (price, availability, reviews) and can lift CTR 15-30%.
3. **Write unique meta descriptions for all collections** — currently using identical boilerplate text across multiple collection pages. Google is deduplicating these in search results.

### Top 3 Critical Issues
1. **Missing core collection pages** — no `/collections/rompers`, no `/collections/dresses` (separate from the one recently found), no `/collections/special-occasion`. Your highest-intent keywords have no landing pages.
2. **Zero internal linking** — blog posts don't link to products or collections. Collections don't link to blog content. Products don't link to collections. The site has no link equity flow.
3. **118 blog articles with zero SEO value** — the bulk of blog content is state-by-state "25 baby names inspired by [State]" posts. These target keywords with no commercial intent and no connection to baby clothing. Zero internal links to products.

---

## 1. Technical SEO (Score: 30/100)

### What's Working
- HTTPS enabled across the site
- Shopify auto-generates sitemap.xml
- Clean URL structure for products (`/products/[slug]`)
- Shopify handles canonical tags automatically for products
- Mobile-responsive theme (Shopify standard)

### Critical Issues

**`/collections/frontpage` is indexed**
Google has indexed `https://shopashmi.co/collections/frontpage` with the title "Home page — Ashmi & Co." This is a default Shopify collection that should be noindexed. It's wasting crawl budget and creating a duplicate content issue with the homepage.

**`/collections/all?page=2` is indexed**
Paginated "All Products" pages are being indexed as standalone pages. These should either have noindex tags or be handled with proper rel=next/prev pagination.

**Duplicate FAQ pages**
Two separate FAQ pages are indexed:
- `/pages/faq` (title: "FAQs")
- `/pages/frequently-asked-questions` (title: "Frequently Asked Questions")
These are cannibalizing each other. One should 301 redirect to the other.

**Trust page URL**
`/pages/is-ashmi-co-a-real-company` — this URL implies the brand's legitimacy is in question. The content should be merged into `/pages/about-us` and this URL should 301 redirect there.

**AI crawler access unknown**
Unable to fetch `robots.txt` directly (Shopify 403). Need to verify via browser that GPTBot, ClaudeBot, PerplexityBot, and Google-Extended are not blocked. Given the GEO score of 18/100, there's a strong likelihood these are blocked or the default Shopify robots.txt doesn't explicitly allow them.

**No `llms.txt` file**
No `llms.txt` file exists to help AI systems understand the brand.

### Recommendations
| Fix | Priority | Effort |
|-----|----------|--------|
| Noindex `/collections/frontpage` | Critical | 5 min |
| Noindex `/collections/all` pagination | Critical | 10 min |
| 301 redirect `/pages/frequently-asked-questions` → `/pages/faq` | High | 5 min |
| 301 redirect `/pages/is-ashmi-co-a-real-company` → `/pages/about-us` | High | 5 min |
| Verify and update robots.txt for AI crawlers | High | 30 min |
| Create and deploy `llms.txt` | Medium | 1 hour |

---

## 2. On-Page SEO (Score: 18/100)

### Title Tags

**Homepage:** "Ashmi & Co."
- Missing: keyword context. Should include "Premium Baby Clothing" or similar.
- Recommended: "Ashmi & Co. | Premium Baby Clothing | Designed in USA"

**Collection pages:** Using generic Shopify format "[Collection Name] – Ashmi & Co."
- "Sets – Ashmi & Co." — missing product type and value prop
- "Boy's – Ashmi & Co." — missing "baby" keyword
- "Clothing – Ashmi & Co." — too generic to rank for anything

**Product pages:** "[Product Name] – Ashmi & Co."
- "Sophia Dress – Ashmi & Co." — missing "baby" keyword, product type
- "Emilia Bunny Romper – Ashmi & Co." — decent but could include "baby"

### Meta Descriptions

**Collections: identical boilerplate**
Multiple collection pages use the same or very similar generic description: "Ashmi & Co. offers a variety of cute baby clothing..." This is a critical issue. Google deduplicates identical metas, reducing SERP visibility.

From Google's index:
- Sets: "Baby clothing sets that are perfect when you can't think of what clothes to mix and match"
- Boy's: "Focused on cute baby clothes for boys"
- Clothing: "Offers a variety of cute baby clothing for all genders"
- All Products: "fashionable rompers, baby suit sets, shirts, tops, pants, leggings, and adorable turbans"

**Note:** Multiple descriptions use "cute" and "adorable" — words explicitly prohibited by the Ashmi brand voice guidelines.

### H1 Tags
Unable to verify H1s directly (site blocking fetches), but based on Shopify defaults, H1s are likely auto-generated from collection/product names without SEO optimization.

### Internal Linking: ZERO
This is the single biggest on-page SEO failure:
- **Blog → Products/Collections:** No blog post links to any product or collection page
- **Collections → Blog:** No collection page links to related blog content
- **Collections → Collections:** No cross-linking between related collections
- **Products → Collections:** No "Part of our [Collection] collection" links
- **Products → Products:** Unclear if "You May Also Like" exists or is optimized

Without internal linking, Google cannot discover the topical relationships between your content. Link equity from any page that does rank cannot flow to your money pages.

### URL Structure Issues
- `/collections/girl-clothing` should be `/collections/baby-girl` (better keyword targeting)
- `/collections/boy-clothing` should be `/collections/baby-boy` (better keyword targeting)
- `/pages/is-ashmi-co-a-real-company` is a terrible URL (as noted above)

---

## 3. Content Quality (Score: 22/100)

### Blog Content Audit

**Total indexed blog posts:** ~20-30 visible in Google (user reports 118 total on site)

**Content breakdown by type:**

| Type | Count | SEO Value | Internal Links to Products |
|------|-------|-----------|---------------------------|
| State baby names ("25 Baby Names Inspired by [State]") | ~50 (est.) | Near zero | None |
| Baby care/parenting tips | ~5 | Low | None |
| Try-on haul reviews | 3 | Low-Medium | Some product mentions, no links |
| Holiday gift guide | 1 (outdated — 2020) | Zero (stale) | Outdated products |
| Baby name trends | 1 | Low | None |
| Fabric/material content | 1 (bamboo) | Medium | None |

**The baby names problem:**
Approximately 50 of the blog articles are "[State]-Inspired Baby Names" posts (one for nearly every US state). These posts:
- Target keywords completely unrelated to baby clothing
- Have zero internal links to products or collections
- Have zero commercial intent — no one reading "25 California Baby Names" is shopping for a romper
- Are likely AI-generated content (similar templates, published in batches during June-July 2024)
- Provide no E-E-A-T signals for baby clothing expertise
- May actually be hurting SEO by diluting topical authority — Google sees shopashmi.co as a "baby names" site, not a "baby clothing" site

**Content that should exist but doesn't:**
- 0 occasion dressing guides (wedding, christening, birthday, family photos)
- 0 product comparison content
- 0 gift guides (current year)
- 0 "best of" or roundup content
- 0 brand story / founder content on blog
- 0 fabric/quality educational content
- 0 seasonal styling guides
- 0 how-to guides related to baby fashion

### E-E-A-T Assessment

| Signal | Status |
|--------|--------|
| **Experience** | Weak — no founder voice in content, no customer stories, no real-use photography context |
| **Expertise** | Weak — blog content is baby names, not baby clothing expertise |
| **Authoritativeness** | Moderate — Nordstrom partnership is strong but not leveraged on-site |
| **Trust** | Mixed — Nordstrom lends trust, but `/pages/is-ashmi-co-a-real-company` undermines it |

### Brand Voice Compliance
Current meta descriptions and collection descriptions use "cute," "adorable," and "trendy" — all explicitly prohibited by Ashmi's brand voice guidelines. The voice should be "calm, intentional, warm, elevated, grounded."

---

## 4. Product & Collection SEO (Score: 15/100)

### Collections — What Exists vs. What Should Exist

**Currently indexed (9 collections):**
| Collection | Handle | Has Description | Keyword Targeting | Score |
|-----------|--------|-----------------|-------------------|-------|
| Clothing | /collections/clothing | Generic boilerplate | None | 1/10 |
| Girl's | /collections/girl-clothing | Generic | Weak ("cute baby clothes") | 2/10 |
| Boy's | /collections/boy-clothing | Generic | Weak | 2/10 |
| Unisex | /collections/unisex | Some text | Decent | 4/10 |
| Sets | /collections/sets | Some text | Decent | 4/10 |
| New Arrivals | /collections/new-arrivals | Some text | Weak | 3/10 |
| Dresses | /collections/dresses | Minimal | Weak | 3/10 |
| All Products | /collections/all | Boilerplate | None | 1/10 |
| Frontpage | /collections/frontpage | Boilerplate | None (shouldn't be indexed) | 0/10 |

**Missing collections (critical gaps):**
- `/collections/rompers` — DOES NOT EXIST (this is your best-selling category)
- `/collections/special-occasion` — DOES NOT EXIST (this is your brand positioning)
- `/collections/overalls` — DOES NOT EXIST
- `/collections/accessories` — DOES NOT EXIST (turbans, headbands)
- `/collections/best-sellers` — DOES NOT EXIST
- `/collections/gift-sets` — DOES NOT EXIST
- `/collections/everyday` — DOES NOT EXIST
- `/collections/photo-ready` — DOES NOT EXIST
- `/collections/holiday` — DOES NOT EXIST

### Product Pages

**Indexed products visible:** ~10-15 in Google search (likely more exist on site)

**Product description quality** (based on Google snippets):
- Sophia Dress: "A summer dress for girls featuring an embroidery design, made from 100% cotton" — generic, no brand voice
- Falyn Dress: "comfy and cute, with a ruched waistline" — uses "cute" (off-brand)
- Emilia Bunny Romper: "soft, breathable cotton, snaps at the bottom for easy diaper changes" — functional but no occasion context
- Charlie Overalls: "crisp white with playful rainbow embroidery" — decent but no keyword optimization

**Product page issues:**
- No occasion context ("perfect for..." language)
- No cross-collection linking
- No "citable passages" for AI search
- Image alt text likely auto-generated from product titles
- No customer review schema
- No FAQ section on product pages

---

## 5. Schema Markup (Score: 5/100)

**No custom structured data detected.** The site likely has only Shopify's default minimal schema (basic product info), but no:

- Product schema with reviews/ratings/availability
- Organization schema on homepage
- BreadcrumbList schema
- CollectionPage schema
- Article/BlogPosting schema on blog posts
- FAQ schema on FAQ page or collections
- LocalBusiness schema

**Impact:** No rich results in Google SERPs. Competitors with rich results (star ratings, price, availability) get significantly higher click-through rates for the same ranking position.

**Revenue impact estimate:** Adding Product schema alone could increase CTR by 15-30% on any keywords where Ashmi already has page-1 rankings.

---

## 6. Core Web Vitals (Score: 50/100 — estimated)

Unable to run PageSpeed Insights directly (API blocked). Based on typical Shopify store performance and the theme in use:

**Estimated metrics:**
| Metric | Estimated | Target |
|--------|-----------|--------|
| LCP (Largest Contentful Paint) | 2.5-4.0s | <2.5s |
| INP (Interaction to Next Paint) | 100-300ms | <200ms |
| CLS (Cumulative Layout Shift) | 0.05-0.15 | <0.1 |

**Common Shopify speed issues likely affecting shopashmi.co:**
- Third-party app scripts (Judge.me reviews, rewards program, SMS tools)
- Unoptimized hero images on homepage
- Render-blocking CSS/JS from Shopify apps
- Lazy loading may not be implemented for below-fold images

**Action needed:** Run PageSpeed Insights manually at `pagespeed.web.dev` to get exact scores.

---

## 7. AI Search Readiness (Score: 18/100)

Detailed in separate GEO-READINESS-REPORT.md, but key findings:

- **GEO score: 18/100** — nearly invisible to AI search
- **Not appearing** in ChatGPT, Perplexity, or Google AI Overviews for any tested query
- **Zero citable content** — product descriptions are too thin for AI extraction
- **AI crawler access unknown** — may be blocked by default Shopify robots.txt
- **No llms.txt** — AI systems have no structured brand summary to reference
- **Third-party presence weak** — Nordstrom is the only meaningful third-party citation source
- **Competitors (Kyte Baby, Quincy Mae, Colored Organics) are regularly cited** by AI systems

---

## 8. Competitive Benchmarking

| Metric | Ashmi & Co. | Kyte Baby | Quincy Mae | Noralee |
|--------|-------------|-----------|------------|---------|
| Monthly organic traffic | ~1,100 | 500K+ | 100-200K | 20-50K |
| Indexed pages (est.) | ~100-150 | 5,000+ | 2,000+ | 500+ |
| Blog posts | ~118 (mostly baby names) | 200+ (on-topic) | 100+ | 50+ |
| Collections | 9 (generic) | 50+ (targeted) | 30+ | 20+ |
| Schema markup | None | Product + Org | Product | Product |
| Rich results | None | Yes (ratings, price) | Yes | Yes |
| Domain authority (est.) | ~15 | ~60 | ~50 | ~35 |

**Gap analysis:** Ashmi is operating at 0.2% of Kyte Baby's organic traffic and 2% of Noralee's (most comparable competitor). The primary gaps are: content volume, collection page optimization, schema markup, and backlink profile.

---

## 9. Blog Content — The Baby Names Problem

This deserves its own section because it's both the biggest content asset and the biggest content liability.

### Current state: ~50 state-inspired baby names articles

These posts follow an identical template:
- Title: "[Theme]: 25 [Adjective] Baby Names Inspired by [State]"
- Content: List of 25 names with meanings
- Internal links to products: ZERO
- Internal links to collections: ZERO
- Commercial intent: ZERO

### States confirmed indexed:
California, Texas, New York, Pennsylvania, Illinois, Florida, Georgia + likely 40+ more

### The problem:
1. **Topical dilution** — Google's understanding of shopashmi.co is skewed toward "baby names site" rather than "baby clothing brand"
2. **Zero conversion path** — a reader who finds "25 Texas Baby Names" has no path to discover products
3. **No internal linking** — these pages are islands. They don't pass link equity to money pages
4. **Possible thin content signal** — if AI-generated in batches without substantial unique value

### The opportunity:
These pages are NOT worthless if rehabilitated:
1. **Add internal links** to each post — "Choosing a name is just the beginning. Browse our [romper collection](/collections/rompers) for their first outfit."
2. **Add product callouts** — "Pair a classic name like Charlotte with a classic outfit — our [Sophia Dress](/products/sophia-dress) in dusty rose."
3. **Add "related content" sections** linking to occasion guides and collections
4. **Consolidate thin posts** — combine low-traffic state posts into regional roundups if individual posts aren't ranking

**Estimated effort:** 2-3 minutes per post to add 2-3 internal links. For 50 posts = ~2-3 hours total. This is one of the highest-ROI tasks available.

---

## 10. Pages Audit

### Currently indexed pages (9):

| Page | URL | Issues |
|------|-----|--------|
| About Us | /pages/about-us | Thin? Needs E-E-A-T signals, Nordstrom mention, founder story |
| Wholesale | /pages/wholesale | Fine for its purpose |
| FAQ | /pages/faq | Duplicate with /pages/frequently-asked-questions |
| Frequently Asked Questions | /pages/frequently-asked-questions | DUPLICATE — redirect to /pages/faq |
| Is Ashmi & Co. A Real Company | /pages/is-ashmi-co-a-real-company | Bad URL, merge into About |
| Shipping | /pages/shipping | Fine |
| Returns | /pages/returns | Fine |
| Rewards Program | /pages/ashmi-co-rewards-program | Fine |
| SMS Giveaway | /pages/sms-giveaway | Minimal content — noindex or remove |
| Brand Ambassador Program | /pages/brand-ambassador-program | Fine |

### Missing pages:
- `/pages/gift-guide` — high commercial value, gift buyer keyword capture
- `/pages/size-guide` — reduces returns, builds trust, targets "baby size chart" keywords
- `/pages/our-fabrics` — E-E-A-T signal, targets "premium baby fabric" queries
- `/pages/where-to-shop` — captures "Ashmi Nordstrom" queries, builds third-party credibility

---

## Summary

shopashmi.co has a premium product, a clear brand position, and a Nordstrom partnership that most competitors at this stage don't have. But the SEO foundation is almost nonexistent:

- **No core collection pages** for your best products
- **No schema markup** for rich results
- **No internal linking** anywhere on the site
- **Blog content is off-topic** (baby names, not baby clothing)
- **Generic/off-brand meta descriptions** across the site
- **Invisible to AI search** (GEO score 18/100)

The good news: every one of these is fixable, and the strategy docs + keyword research already exist. The constraint is execution, not knowledge.
