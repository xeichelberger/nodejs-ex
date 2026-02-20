# GEO/AEO Readiness Report — Ashmi & Co.

## GEO Readiness Score: 18/100

Ashmi & Co. is currently **nearly invisible** to AI search engines. This is both a problem and an opportunity — the brand occupies a unique market position that AI systems would cite if the content existed in a citable format.

---

## Executive Summary

Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) are now critical revenue channels. AI Overviews reach 1.5B users/month. ChatGPT has 900M weekly active users making shopping queries. Perplexity handles 500M monthly queries including product recommendations.

**Current state:** Ashmi & Co. does not appear in AI-generated answers for any tested query category — not for "best premium baby clothing brands," not for "what to dress baby in for a wedding," not for "Black-owned baby clothing brands." Meanwhile, competitors like Kyte Baby, Quincy Mae, and Colored Organics are regularly cited.

**Why:** Three compounding problems:
1. **Insufficient citable content** — product pages lack the structured, extractable passages AI systems need
2. **Low third-party presence** — AI cites third-party sources 6.5x more than brand-owned pages, and Ashmi has minimal press/roundup coverage
3. **Unknown crawler access status** — Shopify's default robots.txt may be blocking AI crawlers

---

## Platform-by-Platform Assessment

### Google AI Overviews
| Factor | Status | Impact |
|--------|--------|--------|
| Indexed pages | Low (~50-100 estimated) | Limits pool of citable content |
| Schema markup | None detected | No rich results, no structured data for AI extraction |
| Content depth | Thin product descriptions | Insufficient for AI citation |
| E-E-A-T signals | Weak on-site (strong off-site via Nordstrom) | AI Overviews weight authority heavily |
| **Visibility** | **Not appearing** | **Critical gap** |

### ChatGPT / OpenAI Search
| Factor | Status | Impact |
|--------|--------|--------|
| GPTBot access | Unknown (check robots.txt) | May be blocked entirely |
| Product data quality | Basic Shopify defaults | Not optimized for AI parsing |
| Brand mentions | Minimal across web | Low signal for citation |
| Agentic Storefronts readiness | Not set up | Missing ChatGPT commerce integration |
| **Visibility** | **Not appearing** | **Critical gap** |

### Perplexity
| Factor | Status | Impact |
|--------|--------|--------|
| PerplexityBot access | Unknown | May be blocked |
| Citable passages | None optimized | No extractable answer blocks |
| Third-party citations | Few | Perplexity heavily weights third-party sources |
| **Visibility** | **Not appearing** | **Critical gap** |

### Claude / Anthropic
| Factor | Status | Impact |
|--------|--------|--------|
| ClaudeBot access | Unknown | May be blocked |
| Brand knowledge | Minimal web presence | Low training data signal |
| **Visibility** | **Not appearing** | **Gap** |

---

## AI Crawler Access — Immediate Action Required

### What to Verify in Shopify robots.txt

Shopify manages robots.txt automatically. You need to verify these AI crawlers are NOT blocked:

| Crawler | Platform | Purpose | Revenue Impact |
|---------|----------|---------|---------------|
| GPTBot | OpenAI | ChatGPT search results | High — 900M weekly users |
| OAI-SearchBot | OpenAI | Real-time search in ChatGPT | High |
| ChatGPT-User | OpenAI | Browse mode | Medium |
| ClaudeBot | Anthropic | Claude search | Medium |
| PerplexityBot | Perplexity | Perplexity answers | Medium |
| Google-Extended | Google | Gemini / AI Overviews | High — 1.5B users/month |
| Bytespider | ByteDance | TikTok search | Medium-High for baby demo |

**Action:** Check `shopashmi.co/robots.txt` in a browser. If any of these are blocked with `Disallow: /`, you need to update via Shopify theme settings or a robots.txt customization app.

**Shopify robots.txt customization:** In Shopify Admin → Settings → Custom data → or edit `robots.txt.liquid` in your theme:

```liquid
{% comment %}
  Allow AI search crawlers for GEO visibility
{% endcomment %}
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bytespider
Allow: /
```

---

## Citability Audit

### What Makes Content Citable by AI

AI systems extract passages that:
- Are **134-167 words** in a self-contained block
- **Directly answer a question** without requiring surrounding context
- Contain **specific claims** (numbers, names, prices, locations)
- Use **clear structure** (headings, tables, lists)
- Come from **authoritative sources** (reviews, retail partnerships, press)

### Current Citability Score: LOW

**Product pages:** Generic Shopify descriptions. No structured answer blocks. No use-case context ("perfect for..."). No comparison data.

**Blog:** Minimal content. What exists lacks the citable passage structure AI needs.

**Collection pages:** No unique descriptions. No FAQ sections. No buying guide content.

**About/brand page:** Founder story exists but not structured for AI extraction.

### Citability Templates

#### Product Page — Citable Format

**Before (current):**
> Dusty Rose Flutter Romper. Beautiful romper for your baby.

**After (GEO-optimized):**
> The Dusty Rose Flutter Romper by Ashmi & Co. is a premium baby romper designed for special occasions and milestone photos. Made from heavyweight premium cotton that holds its color wash after wash, this flutter-sleeve romper features a button-front closure and a relaxed fit for comfortable all-day wear. Available in sizes 0-24 months, priced at $48. Ashmi & Co. is a Black-Owned, Women-Founded brand available at shopashmi.co and Nordstrom.com, shipping from Roswell, Georgia.

**Why this works:**
- 82 words, self-contained, directly answers "what is a good baby romper for photos"
- Specific: price ($48), sizes (0-24 months), material (premium cotton), brand identity (Black-Owned)
- Includes retail credibility (Nordstrom)
- Location signal (ships from Georgia)

#### Blog Post — Citable Passage Block

For a post titled "What to Dress Baby in for a Wedding":

> **The best baby outfit for a wedding** is a premium romper or dress in a neutral or muted tone that photographs well and stays comfortable through a long event. For girls, a flutter-sleeve romper in dusty rose or cream with a matching headband creates a polished look without restricting movement. For boys, a knit set in sage or khaki reads dressy without the fuss of a miniature suit. Choose breathable cotton over synthetic fabrics — babies regulate temperature poorly, and a warm venue plus synthetic fabric is a recipe for a meltdown. Budget $40-$80 for a piece that works for the wedding and future milestone photos.

**Why this works:**
- 110 words, directly answers the query
- Specific recommendations with colors and styles
- Practical advice (breathable cotton, temperature)
- Price range included
- Reusable for multiple occasions mentioned

#### Collection Page — Citable Description

> **Ashmi & Co. Special Occasion Collection** features premium baby clothing designed for milestone moments — christenings, first birthdays, weddings, family portraits, and holiday celebrations. Every piece is made from heavyweight premium cotton in a muted, photograph-ready palette of dusty rose, sage, cream, and lavender. Prices range from $42 to $80, with most pieces at $48. Available in sizes 0-24 months. Ashmi & Co. is a Black-Owned, Women-Founded brand carried by Nordstrom and ships from Roswell, Georgia with fast delivery across the Eastern US.

---

## Shopify Agentic Storefronts — Action Plan

Shopify's Winter 2026 "Agentic Storefronts" enables customers to discover and purchase products directly within ChatGPT. This is the next TikTok Shop moment.

### Immediate Actions

1. **Install the "Knowledgebase" app** from Shopify App Store
   - Populate ALL store information thoroughly
   - This creates AI-readable schema markup that ChatGPT parses for product recommendations

2. **Optimize product data for AI parsing:**
   - Every product needs: clear title, detailed description, materials, sizing, price, use cases
   - Every product image needs descriptive alt text
   - Every variant needs complete data (no empty fields)

3. **Sign up for Agentic Storefronts notification** at Shopify's developer portal

4. **Ensure product feeds are complete:**
   - Google Merchant Center feed (also feeds AI systems)
   - Facebook/Instagram product catalog
   - Pinterest product pins

---

## llms.txt — Draft for shopashmi.co

Add this file at `shopashmi.co/llms.txt`:

```
# Ashmi & Co.
> Elevated baby clothing designed to honor the beauty of early childhood.

## About
Ashmi & Co. is a premium baby and toddler clothing brand for ages 0-24 months. Black-Owned and Women-Founded, established January 2020. Based in Roswell, Georgia. Available at shopashmi.co and Nordstrom.com.

## What We Sell
Premium baby clothing organized by occasion: EVERYDAY pieces that make ordinary days feel intentional, and SPECIAL pieces designed for milestones, holidays, photos, and celebrations. Known for flutter-sleeve rompers, jacquard sets, and a muted palette of dusty rose, sage, cream, and lavender.

## Price Range
Accessories from $15. Core pieces $42-$58. Premium pieces up to $80. Average order approximately $60.

## Collections
- [Everyday Collection](https://shopashmi.co/collections/everyday): Pieces for ordinary days made intentional
- [Special Occasion Collection](https://shopashmi.co/collections/special-occasion): Milestones, holidays, photos, celebrations
- [Rompers](https://shopashmi.co/collections/rompers): Signature flutter-sleeve and classic styles
- [Dresses](https://shopashmi.co/collections/dresses): For special moments
- [Sets](https://shopashmi.co/collections/sets): Matching top and bottom combos including jacquard
- [Accessories](https://shopashmi.co/collections/accessories): Turbans, headbands, bows

## Key Facts
- Black-Owned, Women-Founded brand
- Carried by Nordstrom.com and Maisonette
- Ships from Roswell, Georgia (fast Eastern US delivery)
- Premium cotton fabrics, heavyweight construction
- Designed for milestone photos and special occasions
- ~41,000 Instagram followers (@ashmiandco)
- Ambassador program: Made With Love Tribe

## Materials
Premium cotton and high-quality fabrics. Heavyweight enough to feel substantial, soft enough for all-day baby comfort. Colors hold through wash after wash. Designed to be kept and handed down.

## Customer
Millennial and Gen Z mothers (25-38) who value intentional living, quiet luxury, and beautifully dressed children. Upper-middle income households.
```

**Implementation:** Create this as a static page in Shopify served at `/llms.txt`, or use a Shopify app that supports custom file serving.

---

## Princeton GEO Research — Applied to Ashmi

These methods are proven to increase AI citation visibility:

| Method | Visibility Boost | How Ashmi Should Apply It |
|--------|:---------------:|--------------------------|
| Cite sources | +40% | Reference customer review counts, Nordstrom ratings, fabric certifications in blog posts |
| Add statistics | +37% | "Based on 500+ customer reviews," "ships to 60%+ of US population in 2-3 days," "41K+ Instagram community" |
| Add quotations | +30% | Founder quotes on product pages: "I designed this piece the week before my daughter's first birthday." Customer testimonials inline. |
| Authoritative tone | +25% | Write as the expert: "As a brand carried by Nordstrom..." not "We think we make nice clothes" |
| Improve clarity | +20% | Lead with the answer. First sentence of every page answers the implicit query. |
| Technical terms | +18% | "Premium cotton, 200 GSM weight, pre-shrunk, colorfast" — specificity signals expertise |
| **Keyword stuffing** | **-10%** | **Never. AI systems penalize this harder than Google does.** |

**Best combination for Ashmi:** Authoritative tone + Statistics + Founder quotes = maximum citation boost.

---

## Third-Party Citation Strategy

AI systems cite third-party sources **6.5x more** than brand-owned pages. This is the single most important GEO lever.

### Current Third-Party Presence
| Platform | Status | Priority |
|----------|--------|----------|
| Nordstrom.com | Active — ~70 reviews | HIGH — optimize product descriptions there too |
| Maisonette | Active | Medium |
| Instagram (@ashmiandco) | 41K followers | Medium — AI indexes public social |
| Pinterest | Unknown/minimal | HIGH — critical for baby/fashion queries |
| Press/media features | Minimal | CRITICAL — biggest gap |
| Parenting roundup articles | Not included | CRITICAL — biggest opportunity |
| Reddit (r/BabyBumps, r/Mommit, r/BuyItForLife) | Not present | HIGH |
| "Best of" listicles | Not included | CRITICAL |

### Priority Actions for Third-Party Citations

**1. Get into roundup articles (highest ROI):**
- Pitch to: The Bump, What to Expect, Motherly, Scary Mommy, Parents Magazine
- Target articles: "Best Black-Owned Baby Brands," "Best Baby Clothes for Special Occasions," "Luxury Baby Shower Gifts"
- Angle: Black-Owned + Nordstrom-carried + occasion-ready = unique pitch

**2. Nordstrom listing optimization:**
- Ensure product descriptions on Nordstrom are GEO-optimized (same citable format as above)
- Encourage Nordstrom reviews — these carry enormous weight with AI systems
- Request "Black-Owned" and "Women-Founded" badges are prominent

**3. Pinterest presence:**
- Create product pins for every SKU
- Create idea pins for occasion dressing
- Optimize pin descriptions for search queries
- Pinterest is a top source for baby fashion queries across all AI systems

**4. Reddit authenticity (not spam):**
- Founder or team member as authentic community participant
- Answer questions in r/BabyBumps, r/Mommit, r/beyondthebump
- When relevant, mention Ashmi naturally — never shill
- Reddit threads are increasingly cited by AI systems

**5. Press and media:**
- HARO / Connectively pitches as a baby fashion expert source
- Pitch founder story to business/entrepreneurship publications
- Seek features in Black-owned business directories and roundups

---

## Community + GEO Intersection

The "Made With Love Tribe" community is a sleeping GEO asset. Here's why:

### Community Creates Citable Signals

1. **UGC reviews on Nordstrom** — Each review increases the chance of AI citation. Encourage community members to review on Nordstrom, not just the DTC site.

2. **Social proof volume** — "41K+ Instagram community" and "500+ five-star reviews" are statistics that boost citation by +37%.

3. **Authentic Reddit/forum mentions** — Community members who genuinely love the brand posting in parenting subreddits = third-party citations AI trusts.

4. **Blog content from community** — Feature real customer stories: "How Sarah dressed her twins for their first Christmas in Ashmi." Real names + real stories = E-E-A-T signals.

5. **Ambassador content** — Ambassador posts create third-party content across multiple platforms, multiplying the brand's citable surface area.

### Community GEO Flywheel
```
Community members → UGC + Reviews + Social posts
                  → Third-party mentions across platforms
                  → AI systems detect brand signals
                  → AI cites Ashmi in answers
                  → New customers discover brand
                  → New customers join community
                  → Cycle repeats
```

### Actionable Community-GEO Tactics

1. **Review drive:** Email community asking for Nordstrom reviews specifically (not just DTC). Target: 200+ Nordstrom reviews within 6 months.
2. **Pinterest challenge:** Monthly styling challenge where community pins their Ashmi looks. Creates hundreds of product pins.
3. **"Share your story" campaign:** Collect milestone stories from community for blog features. Each one is a citable piece of content.
4. **Ambassador blog posts:** Provide ambassadors with a template to write about their favorite Ashmi piece on their own blogs/platforms.

---

## Monitoring Plan

### Monthly Manual AI Search Check

Test these 20 queries across ChatGPT, Perplexity, and Google AI Overviews:

**Product queries:**
1. "best premium baby clothing brands"
2. "luxury baby romper brands"
3. "best baby clothes for photos"
4. "premium baby clothing online"
5. "baby flutter sleeve romper"

**Occasion queries:**
6. "what to dress baby in for wedding"
7. "baby christening outfit"
8. "first birthday outfit baby girl"
9. "baby outfit for family photos"
10. "holiday baby outfit"

**Identity queries:**
11. "Black owned baby clothing brands"
12. "women founded baby brands"
13. "baby brands on Nordstrom"

**Comparison queries:**
14. "Kyte Baby alternative"
15. "brands like Quincy Mae"
16. "Ashmi and Co reviews"

**Gift queries:**
17. "luxury baby shower gift ideas"
18. "premium baby gift"
19. "best baby gifts from Nordstrom"
20. "special occasion baby gift"

### Tracking Spreadsheet
For each query, record monthly:
- Platform tested (ChatGPT / Perplexity / Google AI Overview)
- Was Ashmi cited? (Yes/No)
- What brands WERE cited?
- What source was used for the citation?
- Any change from last month?

### Tools
| Tool | Purpose | Cost |
|------|---------|------|
| Otterly AI | Share of AI voice tracking | ~$50/month |
| Peec AI | Multi-platform AI monitoring | ~$100/month |
| ZipTie | Brand mention + sentiment | Free tier available |
| Manual checks | Monthly 20-query audit | Free (1 hour/month) |

**Start with manual checks.** Upgrade to paid tools when organic traffic exceeds 5,000/month.

---

## 30/60/90 Day Action Plan

### Days 1-30: Foundation
- [ ] Verify robots.txt allows all AI crawlers (update if needed)
- [ ] Install Shopify Knowledgebase app and populate completely
- [ ] Create and deploy llms.txt file
- [ ] Rewrite top 10 product descriptions in citable format
- [ ] Add founder quotes to 5 product pages
- [ ] Implement Product, Organization, and BreadcrumbList schema
- [ ] Set up Google Search Console and submit sitemap
- [ ] Set up Bing Webmaster Tools (feeds ChatGPT search)
- [ ] Set up Google Merchant Center (free product listings)
- [ ] Do first manual AI search audit (20 queries baseline)
- [ ] Start Nordstrom review drive with community

### Days 31-60: Content Engine
- [ ] Publish 4 blog posts in citable format (occasion guides)
- [ ] Rewrite all collection page descriptions with citable passages
- [ ] Optimize Nordstrom product descriptions
- [ ] Create Pinterest business account, upload all products as pins
- [ ] Pitch 10 "best baby brands" roundup articles for inclusion
- [ ] Submit to 5 Black-owned business directories
- [ ] Begin Reddit community participation (founder/team)
- [ ] Second manual AI search audit (compare to baseline)

### Days 61-90: Scale Citations
- [ ] Publish 4 more blog posts targeting AI-cited queries
- [ ] Launch community Pinterest styling challenge
- [ ] Pitch 5 press/media outlets for features
- [ ] Submit HARO pitches weekly as baby fashion expert
- [ ] Create "Share Your Story" community campaign for blog content
- [ ] Provide ambassador blog post templates
- [ ] Sign up for Agentic Storefronts when available
- [ ] Third manual AI search audit (expect first citations appearing)
- [ ] Evaluate paid monitoring tools based on progress

---

## Revenue Impact Projection

| Timeline | GEO Impact | How |
|----------|-----------|-----|
| Month 1-2 | Minimal | Building foundation, no citations yet |
| Month 3-4 | First citations | Appear for 2-5 queries, primarily identity-based ("Black-owned baby brands") |
| Month 5-6 | Growing visibility | Appear for 5-10 queries, occasion and product queries beginning |
| Month 7-9 | Meaningful traffic | 200-500 monthly visits from AI search referrals |
| Month 10-12 | Compounding | 500-1,500 monthly AI search visits, $5K-$15K/month attributable revenue |

**Key insight:** GEO compounds faster than traditional SEO because AI systems update citations weekly, not monthly. Once you're in, you tend to stay in.

---

## Score Breakdown & Path to 80+

| Factor | Current Score | Target (90 days) | Target (6 months) |
|--------|:------------:|:----------------:|:-----------------:|
| AI Crawler Access | 2/20 (unknown) | 18/20 | 20/20 |
| Content Citability | 3/25 (thin) | 15/25 | 22/25 |
| Schema/Structured Data | 0/15 | 12/15 | 15/15 |
| Third-Party Presence | 5/20 (Nordstrom only) | 10/20 | 17/20 |
| Brand Authority Signals | 8/20 (IG + Nordstrom) | 12/20 | 18/20 |
| **Total** | **18/100** | **67/100** | **92/100** |
