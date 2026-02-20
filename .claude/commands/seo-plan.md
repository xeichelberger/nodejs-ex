# SEO Strategy & Planning — Ecommerce

You are an expert ecommerce SEO strategist. Your goal is to create a comprehensive, phased SEO strategy for a Shopify store selling premium baby clothing.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## 6-Step Process

### 1. Discovery
- Current organic traffic baseline (~1,100 monthly sessions)
- Existing content inventory (products, collections, blog posts, pages)
- Current keyword rankings (if GSC data available)
- Technical health (see `/project:seo-audit`)
- Competitor organic performance

### 2. Competitive Analysis
Analyze top 5 competitors' SEO strategy:
- **Kyte Baby** — Dominant organic presence, bamboo keyword ownership
- **Quincy Mae** — Strong blog content, lifestyle positioning
- **Rylee + Cru** — Visual-first SEO, Pinterest traffic
- **Colored Organics** — Organic cotton keyword targeting
- **Noralee** — Occasion-wear keyword focus

For each competitor, assess:
- Top ranking keywords and content
- Content strategy (what topics, what depth)
- Keyword gaps (what they rank for that Ashmi doesn't)
- E-E-A-T signals
- Schema implementation
- AI search presence

### 3. Architecture Design
URL hierarchy for ecommerce:

```
shopashmi.co/
├── /collections/
│   ├── /collections/everyday/
│   ├── /collections/special-occasion/
│   ├── /collections/rompers/
│   ├── /collections/dresses/
│   ├── /collections/sets/
│   ├── /collections/accessories/
│   ├── /collections/new-arrivals/
│   ├── /collections/best-sellers/
│   └── /collections/sale/
├── /products/ (individual products)
├── /blogs/journal/ (main blog)
│   ├── Occasion dressing guides
│   ├── Gift guides
│   ├── Style inspiration
│   ├── Fabric & care
│   └── Founder perspective
├── /pages/
│   ├── /pages/about / our-story
│   ├── /pages/size-guide
│   ├── /pages/shipping-returns
│   └── /pages/wholesale
└── /gift-guide/ (seasonal landing pages)
```

### 4. Content Strategy
Map content to search intent and funnel stage:

| Funnel Stage | Query Type | Content Type | Example |
|-------------|-----------|-------------|---------|
| Awareness | Informational | Blog post | "What to dress baby in for wedding" |
| Consideration | Comparison | Guide/listicle | "Best premium baby clothing brands" |
| Consideration | Commercial | Collection page | "Special occasion baby rompers" |
| Decision | Transactional | Product page | "Dusty rose flutter sleeve romper" |
| Retention | Informational | Blog/email | "How to care for premium baby clothes" |

**Priority content to create:**
1. Occasion-specific dressing guides (wedding, christening, first birthday, holidays)
2. Gift guides by recipient/occasion
3. "Best X" comparison content where Ashmi naturally fits
4. Size and fit guides
5. Fabric and care content
6. Founder/brand story content for E-E-A-T

### 5. Technical Foundation
- Schema markup implementation (see `/project:seo-schema`)
- Core Web Vitals optimization
- Mobile experience optimization
- Internal linking strategy (blog ↔ products ↔ collections)
- AI search readiness (see `/project:seo-geo`)

### 6. Implementation Roadmap

**Phase 1: Foundation (Weeks 1-4)**
- Fix technical SEO issues (audit findings)
- Implement Product, Organization, BreadcrumbList schema
- Optimize top 20 product page titles and descriptions
- Optimize collection page content (add unique descriptions)
- Set up GSC and analytics tracking

**Phase 2: Content Expansion (Weeks 5-12)**
- Publish 2 blog posts/week (occasion guides, gift guides)
- Build internal linking between blog and products
- Create cornerstone content for top keywords
- Optimize existing blog posts
- Start building E-E-A-T signals

**Phase 3: Scale (Weeks 13-24)**
- Expand blog to cover full content calendar
- Build comparison/alternatives content
- Pursue press and influencer mentions for authority
- Implement AI search optimization
- Create seasonal landing pages

**Phase 4: Authority (Months 7-12)**
- Pursue guest posts and features in parenting publications
- Build topical authority cluster around "baby occasion dressing"
- Expand into adjacent topics
- Evaluate and optimize based on data
- Target featured snippets and AI citations

## KPI Targets

| Metric | Current | 6-Month Target | 12-Month Target |
|--------|---------|:-------------:|:--------------:|
| Monthly organic sessions | ~1,100 | 3,000-5,000 | 8,000-12,000 |
| Organic revenue | Unknown | Track baseline | 20% of DTC revenue |
| Keywords ranking top 10 | Unknown | 50+ | 150+ |
| Blog posts published | ~few | 30+ | 80+ |
| Domain authority | Unknown | +5 points | +10 points |
| AI search citations | Unknown | Appear for 5+ queries | Appear for 20+ queries |

## Output

Generate these files:
- **SEO-STRATEGY.md** — Full strategy document
- **COMPETITOR-ANALYSIS.md** — Detailed competitor breakdown
- **CONTENT-CALENDAR.md** — 3-month editorial calendar
- **IMPLEMENTATION-ROADMAP.md** — Week-by-week action plan
- **SITE-STRUCTURE.md** — Recommended URL architecture

## Related Commands
- `/project:seo-audit` — Technical audit
- `/project:seo-content` — Content quality analysis
- `/project:content-strategy` — Detailed content planning
- `/project:seo-geo` — AI search strategy
