# Platform Submissions & Setup Guide — Ashmi & Co.

## Priority Order

1. Google Search Console (Day 1)
2. Google Merchant Center (Day 1)
3. Bing Webmaster Tools (Day 1)
4. Pinterest Business (Week 1)
5. Google Business Profile (Week 1)
6. Rich Results Validation (Week 2)

---

## 1. Google Search Console (GSC)

### Why
GSC is the source of truth for how Google sees your site. Without it, you're flying blind on indexing, rankings, and crawl errors.

### Setup Steps
1. Go to https://search.google.com/search-console
2. Add property: `https://shopashmi.co`
3. Verify ownership via DNS TXT record (recommended) or HTML meta tag
   - For Shopify DNS: Go to Shopify Admin → Settings → Domains → DNS Settings
   - Add TXT record provided by GSC
4. Once verified:
   - Submit sitemap: `https://shopashmi.co/sitemap.xml`
   - Shopify auto-generates sitemaps — verify it's accessible
5. Request indexing for key pages manually:
   - Homepage
   - All collection pages
   - Top-selling product pages
   - About page
   - Any blog posts

### Ongoing GSC Tasks (Weekly)
- [ ] Check "Coverage" for indexing errors
- [ ] Review "Performance" for keyword impressions/clicks
- [ ] Monitor Core Web Vitals
- [ ] Request indexing for new blog posts within 24 hours of publishing
- [ ] Check for manual actions (penalties)
- [ ] Review "Links" report for new backlinks

### Key GSC Reports to Watch
| Report | What It Tells You | Action |
|--------|------------------|--------|
| Performance → Queries | What you rank for | Optimize content for rising queries |
| Performance → Pages | Which pages get traffic | Double down on winners |
| Coverage → Excluded | What's NOT indexed | Fix excluded pages |
| Core Web Vitals | Page speed issues | Fix LCP, FID, CLS issues |
| Links → External | Who links to you | Track backlink growth |
| Sitemaps | Indexing status | Ensure all pages submitted |

---

## 2. Google Merchant Center

### Why
Free product listings in Google Shopping tab. Zero ad spend. Your products appear when people search "baby romper" in Google Shopping. Also feeds Google AI Overviews with structured product data.

### Setup Steps
1. Go to https://merchants.google.com
2. Create account linked to your Google account
3. Verify and claim `shopashmi.co`
4. **Shopify integration (easiest):**
   - Shopify Admin → Sales Channels → Google
   - Install Google & YouTube channel app
   - Connect Google Merchant Center account
   - Sync product catalog automatically
5. Verify product feed:
   - All products have: title, description, price, availability, images, GTIN/MPN
   - Product titles optimized: "Dusty Rose Flutter Sleeve Baby Romper - Ashmi & Co."
   - Product descriptions match GEO-optimized versions
   - High-quality images (at least 800x800)

### Product Feed Optimization
| Field | Good Example | Bad Example |
|-------|-------------|------------|
| Title | "Dusty Rose Flutter Sleeve Baby Romper - Premium Cotton, 0-24mo" | "Lizzie Romper" |
| Description | Full 150+ word GEO-optimized description | "Beautiful romper for baby" |
| Product type | "Apparel & Accessories > Clothing > Baby & Toddler > Rompers" | "Baby Clothes" |
| Brand | "Ashmi & Co." | (empty) |
| Condition | "new" | (empty) |
| Age group | "infant" or "toddler" | (empty) |
| Gender | "female" / "male" / "unisex" | (empty) |
| Color | "Dusty Rose" | "Pink" |
| Material | "Premium Cotton" | (empty) |

### Free Listings Programs
- **Free product listings** — Appear in Google Shopping tab (enabled by default)
- **Free local product listings** — If you have a physical location
- **Product reviews** — Connect Judge.me reviews to Merchant Center

---

## 3. Bing Webmaster Tools

### Why
Bing powers ChatGPT's web search. Being indexed and optimized on Bing directly increases your chances of being cited by ChatGPT. Also covers Yahoo and DuckDuckGo search.

### Setup Steps
1. Go to https://www.bing.com/webmasters
2. Sign in with Microsoft account
3. **Fastest method:** Import from Google Search Console
   - Click "Import from GSC"
   - Authorize access
   - All sites and sitemaps imported automatically
4. If manual setup:
   - Add site: `https://shopashmi.co`
   - Verify via DNS CNAME or meta tag
   - Submit sitemap: `https://shopashmi.co/sitemap.xml`

### Bing-Specific Optimizations
- **IndexNow:** Shopify supports IndexNow protocol — pages get indexed on Bing within minutes of publishing (vs days/weeks on Google)
- **Bing Places:** If you have a physical store/office, claim your Bing Places listing
- **Content submission API:** Submit new blog posts directly for faster indexing

### Bing → ChatGPT Pipeline
When ChatGPT uses "search the web," it queries Bing. Being well-indexed on Bing means:
- Higher chance of ChatGPT finding your content
- Better product data for ChatGPT shopping queries
- More frequent citation in ChatGPT answers

---

## 4. Pinterest Business Account

### Why
Pinterest is the #2 search engine for baby fashion, nursery, and gift queries. It drives high-intent traffic (people on Pinterest are planning purchases). Pinterest content is also heavily cited by AI systems for visual/lifestyle queries.

### Setup Steps
1. Go to https://business.pinterest.com
2. Create or convert to business account
3. Claim website: `shopashmi.co`
4. **Shopify integration:**
   - Install Pinterest app from Shopify App Store
   - Connect Pinterest business account
   - Sync entire product catalog as product pins
   - Enable rich pins (automatically pulls price, availability, description)

### Pinterest SEO Strategy
| Content Type | Frequency | Example |
|-------------|-----------|---------|
| Product pins | Sync all products (auto) | Every SKU as a shoppable pin |
| Lifestyle pins | 3-5x/week | Styled baby photos in Ashmi pieces |
| Idea pins | 2x/week | "5 Ways to Style a Flutter Sleeve Romper" |
| Blog post pins | Per blog post | Pin image for every blog article |
| Gift guide pins | Seasonal | "Baby's First Christmas Gift Guide" |

### Pin Description Optimization
**Good:** "Dusty Rose Flutter Sleeve Baby Romper by Ashmi & Co. Premium cotton, perfect for first birthday photos, christenings, and family portraits. Sizes 0-24 months. $48 at shopashmi.co. Black-Owned, Women-Founded brand also available at Nordstrom."

**Bad:** "Cute baby romper! #baby #romper #cute"

### Pinterest Boards to Create
1. "Special Occasion Baby Outfits"
2. "Everyday Elevated Baby Clothes"
3. "Baby's First Birthday Outfit Ideas"
4. "Baby Wedding Guest Outfits"
5. "Christening & Baptism Outfits"
6. "Baby Photo Shoot Outfit Inspiration"
7. "Neutral Baby Nursery + Style"
8. "Gift Ideas for New Parents"
9. "Ashmi & Co. Lookbook"
10. "Matching Sibling Outfits"

---

## 5. Google Business Profile

### Why
Even without a physical storefront, a Google Business Profile helps with:
- Brand searches ("Ashmi & Co.")
- "Near me" searches if someone is in the Roswell, GA area
- Knowledge panel in search results
- Another indexed entity that AI systems reference

### Setup Steps
1. Go to https://business.google.com
2. Create profile for "Ashmi & Co."
3. Category: "Children's Clothing Store" + "Online Clothing Store"
4. Address: Roswell, GA (can set as service area if no storefront)
5. Add:
   - Logo and cover photos
   - Business hours
   - Website link
   - Product photos
   - Description using brand voice
6. Encourage Google reviews from customers

---

## 6. Rich Results Validation

### Why
Schema markup gets you rich results in Google (star ratings, price, availability under your listing) AND feeds structured data to AI systems.

### Testing Tools
1. **Google Rich Results Test:** https://search.google.com/test/rich-results
   - Test homepage, a product page, a collection page, and a blog post
   - Fix any errors

2. **Schema Markup Validator:** https://validator.schema.org
   - Validate JSON-LD schema is correct
   - Test all schema types (Product, Organization, BreadcrumbList, Article)

3. **Google Structured Data Report** in GSC:
   - After schema is implemented, monitor for errors
   - Check weekly for the first month

### Schema Types to Implement
| Schema | Where | Priority |
|--------|-------|----------|
| Product | Every product page | Critical |
| Organization | Site-wide (homepage) | Critical |
| BreadcrumbList | Every page | High |
| CollectionPage | Collection pages | High |
| Article / BlogPosting | Blog posts | High |
| FAQPage | Collection pages + blog posts | Medium |
| ItemList | "Best of" roundup posts | Medium |
| Review / AggregateRating | Product pages | High |
| WebSite (with SearchAction) | Homepage | Medium |

---

## Additional Platforms

### Facebook / Instagram Shops
- Sync product catalog via Shopify's Facebook channel
- Enable Instagram Shopping tags
- Products in Instagram posts = shoppable links

### TikTok Shop
- Set up via Shopify's TikTok channel
- Sync product catalog
- Enable in-video product tagging

### Shopify Agentic Storefronts (When Available)
- Install Knowledgebase app now
- Sign up for early access notification
- Ensure product data is complete and optimized

---

## Day 1 Checklist

- [ ] Set up Google Search Console → verify → submit sitemap
- [ ] Set up Google Merchant Center → connect Shopify → sync products
- [ ] Set up Bing Webmaster Tools → import from GSC
- [ ] Set up Pinterest Business → connect Shopify → sync catalog
- [ ] Set up Google Business Profile
- [ ] Run Rich Results Test on 5 key pages
- [ ] Install Shopify Knowledgebase app for AI readiness
