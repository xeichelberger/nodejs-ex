# SEO Action Plan — shopashmi.co

**Date:** February 21, 2026
**Based on:** Full SEO Audit (FULL-AUDIT-REPORT.md)
**Current Score:** 24/100
**Target Score:** 65+ within 90 days

---

## QUICK WINS (High Impact, Low Effort) — Do These First

### QW-1: Add internal links to all existing blog posts
- **What:** Add 2-3 internal links to every baby names post and every other blog post linking to relevant collections and products
- **Why:** ~50+ posts with zero internal links = zero link equity flowing to money pages. This is the single fastest way to improve site-wide SEO.
- **Effort:** 2-3 hours for all posts
- **Impact:** HIGH — distributes whatever authority these pages have earned to your collection and product pages
- **How:** For each baby names post, add a closing section: "Still choosing a name? Start choosing their wardrobe too — browse our [romper collection](/collections/rompers) or explore [special occasion outfits](/collections/special-occasion) for their first milestone moments." Add 1-2 inline product mentions where natural.

### QW-2: Fix duplicate/junk indexed pages
- **What:**
  - Noindex `/collections/frontpage`
  - Noindex `/collections/all` (and pagination)
  - 301 redirect `/pages/frequently-asked-questions` → `/pages/faq`
  - 301 redirect `/pages/is-ashmi-co-a-real-company` → `/pages/about-us`
  - Noindex or remove `/pages/sms-giveaway`
- **Effort:** 30 minutes
- **Impact:** MEDIUM — stops crawl budget waste, removes confusing duplicate signals

### QW-3: Rewrite all collection meta descriptions
- **What:** Replace identical boilerplate metas with unique, keyword-targeted, brand-voice-compliant descriptions for every collection
- **Effort:** 1-2 hours
- **Impact:** HIGH — immediately improves CTR from search results, fixes brand voice violations ("cute," "adorable")

---

## CRITICAL PRIORITY (Fix Within 1 Week)

### C-1: Create `/collections/rompers`
- **Target keywords:** "baby rompers" (18-22K MSV), "premium baby romper" (100-300), "flutter sleeve baby romper" (500-1K)
- **Requirements:**
  - SEO-optimized title: "Baby Rompers | Flutter Sleeve, Ruffle & Knit Styles | Ashmi & Co."
  - Unique meta description in brand voice (no "cute" or "adorable")
  - 200+ word collection description with internal links to `/collections/dresses`, `/collections/sets`, `/collections/special-occasion`
  - Link to relevant blog content (once it exists)
  - FAQ section (3 questions) for FAQ schema
- **Assign products:** All romper-type products (Lizzie Flutter, Rumi, Isabella Ruffle, Emilia Bunny, etc.)

### C-2: Create `/collections/special-occasion`
- **Target keywords:** "special occasion baby outfits" (500-1K), "baby wedding outfit" (1-2K), "baby formal wear" (200-500)
- **Requirements:** Same as C-1 but for occasion-focused products
- **This is your brand positioning. It must exist as a page.**

### C-3: Create `/collections/dresses`
- **Target keywords:** "baby girl dresses" (12-18K), "elegant baby dress" (200-500), "baby occasion dress" (300-600)
- **Note:** A `/collections/dresses` page is showing in Google, but verify it has a real description and optimized meta

### C-4: Implement Product schema on all product pages
- **What:** Add JSON-LD Product schema with: name, description, brand, price, currency, availability, image, SKU, review/rating (from Judge.me)
- **How:** Edit `theme.liquid` or `product.liquid` to inject schema via Liquid template
- **Impact:** Enables rich results (price, rating stars, availability) in Google SERPs
- **Effort:** 2-3 hours (one-time template change applies to all products)

### C-5: Implement Organization schema on homepage
- **What:** JSON-LD with brand name, logo, description, founder, address, sameAs links (Instagram, Nordstrom, Maisonette)
- **Effort:** 30 minutes

---

## HIGH PRIORITY (Fix Within 2 Weeks)

### H-1: Create remaining core collections
- `/collections/overalls` — target "baby overalls" (5-8K MSV)
- `/collections/accessories` — target "baby turban headband" (2-4K MSV)
- `/collections/best-sellers` — high commercial intent
- `/collections/gift-sets` — target gift buyer keywords
- `/collections/everyday` — complete the occasion-based architecture

### H-2: Optimize all existing collection descriptions and titles
- Rewrite titles for keyword targeting (include "baby" in all)
- Rename collection handles:
  - `/collections/girl-clothing` → `/collections/baby-girl` (301 redirect old URL)
  - `/collections/boy-clothing` → `/collections/baby-boy` (301 redirect old URL)
- Write 200+ word unique descriptions for all collections with internal links

### H-3: Optimize all product titles and meta descriptions
- Add product type to all titles: "Sophia Dress" → "Sophia Embroidered Dress | Baby Girl Dress"
- Write unique meta descriptions for all products with brand voice compliance
- Add occasion context to descriptions: "Perfect for christenings, family photos, and quiet weekend mornings"

### H-4: Optimize product image alt text
- Audit all product images
- Replace auto-generated alt text with descriptive, keyword-rich alternatives
- Example: "product-image.jpg" → "Dusty rose flutter sleeve baby romper by Ashmi & Co., front view"

### H-5: Add BreadcrumbList schema site-wide
- Implement via theme template
- Structure: Home > [Collection] > [Product] or Home > Blog > [Post]

### H-6: Add Article/BlogPosting schema to all blog posts
- Author, datePublished, dateModified, publisher, headline
- Enables article rich results in search

### H-7: Verify AI crawler access in robots.txt
- Check via browser: `shopashmi.co/robots.txt`
- Ensure GPTBot, ClaudeBot, PerplexityBot, Google-Extended are NOT blocked
- If blocked, update `robots.txt.liquid` in Shopify theme

### H-8: Create `llms.txt` file
- Deploy the llms.txt draft from GEO-READINESS-REPORT.md
- Make accessible at `shopashmi.co/llms.txt`

### H-9: Rewrite About page for E-E-A-T
- Include founder name and story (Uyo Okebie-Eichelberger)
- Mention Nordstrom partnership, Maisonette
- Include "sister brand to Preggo Leggings and You!" for authority
- Add founder photo
- Include Roswell, GA location
- Optimize for "black owned baby clothing brand" keyword

---

## MEDIUM PRIORITY (Fix Within 1 Month)

### M-1: Publish first 4 SEO-targeted blog posts
Following the content calendar, prioritize:
1. "What to Dress Baby in for a Wedding" — targets P1 occasion keyword (1-2K MSV)
2. "Baby Christening Outfit Guide" — targets P1 occasion keyword (2-4K MSV)
3. "Best Premium Baby Clothing Brands 2026" — linkable asset, comparison intent
4. "Black-Owned Baby Clothing Brands to Support" — brand differentiator keyword

**Each post must have:**
- 1,500+ words
- 3+ internal links to collections
- 3+ internal links to specific products
- FAQ section with schema
- Citable passages for AI search (134-167 word self-contained blocks)
- Brand voice compliance
- Author attribution

### M-2: Create `/pages/gift-guide`
- Target "luxury baby gift" (500-1K), "premium baby gift" (100-300), "unique baby gift" (2-4K)
- Organize by occasion and price range
- Link to specific products and gift-sets collection
- Seasonal — plan to update quarterly

### M-3: Create `/pages/size-guide`
- Target "baby clothing size chart" keywords
- Reduce returns, build trust
- Include measurement instructions
- FAQ schema for common sizing questions

### M-4: Set up Google Search Console
- Verify ownership of shopashmi.co
- Submit sitemap.xml
- Monitor index coverage
- Track search performance (impressions, clicks, CTR, position)

### M-5: Set up Google Merchant Center
- Submit product feed
- Enable free product listings in Google Shopping tab
- Required for Agentic Storefronts readiness

### M-6: Add FAQ schema to FAQ page
- The `/pages/faq` page has FAQ content but likely no schema markup
- Adding FAQPage schema enables FAQ rich results in search

### M-7: Update navigation structure
- Add "Shop by Category" dropdown (Rompers, Dresses, Sets, Overalls, Accessories)
- Add "Shop by Occasion" dropdown (Everyday, Special Occasion, Photo Ready)
- Add Gift Guide link
- Remove or deprioritize generic "Clothing" collection from nav

### M-8: Product page CRO + SEO improvements
- Add "citable passages" to product descriptions (GEO optimization)
- Add occasion context: "Best for: weddings, christenings, family photos"
- Add fabric detail section (E-E-A-T signal)
- Ensure "You May Also Like" section exists and links to related products
- Add collection breadcrumb linking ("Part of our Special Occasion collection")

---

## LOW PRIORITY (Backlog)

### L-1: Consolidate or improve baby names blog posts
- Option A: Add internal links to all posts (if not done in QW-1) + add product callouts
- Option B: Consolidate low-traffic state posts into regional roundups
- Option C: Noindex posts with zero traffic after 6+ months

### L-2: Create remaining planned pages
- `/pages/our-fabrics`
- `/pages/where-to-shop`
- `/pages/our-story` (if different from About)

### L-3: Create seasonal collections
- `/collections/spring`, `/collections/summer`, etc.
- Time with seasonal keyword calendar

### L-4: Implement comparison content
- "Ashmi & Co. vs Kyte Baby"
- "Ashmi & Co. vs Quincy Mae"
- Target competitor brand searches (100-500 MSV each)

### L-5: Set up Bing Webmaster Tools
- Feeds ChatGPT search results
- Submit sitemap

### L-6: Pinterest business account setup
- Upload all products as pins
- Create idea pins for occasion dressing
- Critical channel for baby fashion queries

### L-7: Run Core Web Vitals audit
- Use `pagespeed.web.dev` to get exact scores
- Audit app script impact on performance
- Optimize images (WebP, lazy loading)

---

## Implementation Sequence (What to Tell Your Agent)

### Session 1: Quick Wins + Technical Fixes
```
1. Add 2-3 internal links to ALL existing blog posts (link to collections/products)
2. Noindex /collections/frontpage
3. Noindex /collections/all pagination
4. Create 301 redirect: /pages/frequently-asked-questions → /pages/faq
5. Create 301 redirect: /pages/is-ashmi-co-a-real-company → /pages/about-us
6. Rewrite ALL collection meta descriptions (unique, brand voice, keyword-targeted)
```

### Session 2: Create Core Collections
```
1. Create /collections/rompers (title, meta, 200+ word description, internal links, FAQ)
2. Create /collections/special-occasion
3. Verify/optimize /collections/dresses
4. Create /collections/overalls
5. Create /collections/accessories
6. Create /collections/best-sellers
7. Create /collections/gift-sets
8. Create /collections/everyday
```

### Session 3: Schema Markup
```
1. Add Product JSON-LD schema to product template
2. Add Organization JSON-LD schema to homepage
3. Add BreadcrumbList schema to all page types
4. Add Article schema to blog post template
5. Add FAQPage schema to /pages/faq
6. Add CollectionPage schema to collection template
```

### Session 4: Product Page Optimization
```
1. Rewrite all product titles (include product type + "baby")
2. Write unique meta descriptions for all products
3. Audit and fix all product image alt text
4. Add occasion context to product descriptions
5. Add citable passages for GEO
```

### Session 5: First Content Sprint
```
1. Publish "What to Dress Baby in for a Wedding" (1,500+ words, internal links)
2. Publish "Baby Christening Outfit Guide"
3. Publish "Best Premium Baby Clothing Brands 2026"
4. Publish "Black-Owned Baby Clothing Brands to Support"
5. Create /pages/gift-guide
6. Create /pages/size-guide
```

### Session 6: Platform Setup + GEO
```
1. Verify Google Search Console
2. Submit sitemap
3. Set up Google Merchant Center
4. Verify robots.txt AI crawler access
5. Deploy llms.txt
6. Rewrite About page for E-E-A-T
7. Update site navigation
```

---

## Expected Impact Timeline

| Milestone | When | Traffic Impact |
|-----------|------|----------------|
| Quick wins + technical fixes live | Week 1 | Crawl efficiency improved, CTR improvement begins |
| Core collections created | Week 2 | New keyword opportunities indexed (2-4 weeks to rank) |
| Schema markup live | Week 2 | Rich results begin appearing (1-2 weeks) |
| Product pages optimized | Week 3 | Improved rankings for long-tail product keywords |
| First 4 blog posts live | Week 4 | Informational keyword traffic begins (Month 2-3) |
| Internal linking complete | Week 1-4 | Compound effect — all pages benefit from equity flow |
| **Month 3 target** | | **2,000-2,500 sessions/month** (100%+ growth from 1,100) |
| **Month 6 target** | | **4,000-5,000 sessions/month** |
| **Month 12 target** | | **8,000-12,000 sessions/month** |
