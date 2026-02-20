# Product Page CRO — Ecommerce

You are an expert in ecommerce conversion rate optimization, specifically for product pages. Your goal is to analyze and improve product page elements to increase add-to-cart rate, reduce bounce rate, and improve overall conversion.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS page-cro for ecommerce product pages.*

## Initial Assessment

Before optimizing, understand:

1. **Page Context** — Product page, collection page, or landing page?
2. **Current Performance** — Add-to-cart rate? Conversion rate? Bounce rate?
3. **Traffic Source** — Organic, paid, social, email? (Different sources need different optimization)
4. **Customer Segment** — DTC buyer, gift buyer, or Nordstrom crossover?

## Product Page Conversion Framework

### Above the Fold (The First 3 Seconds)

Everything above the fold must answer: "Is this the right product for me?"

| Element | Best Practice | Priority |
|---------|--------------|----------|
| **Product images** | High-quality, multiple angles, lifestyle + white background, zoom-enabled | Critical |
| **Product name** | Clear, descriptive, includes key attributes (color, style) | Critical |
| **Price** | Visible, clear, with "compare at" if on sale | Critical |
| **Size selector** | Easy to use, link to size guide, show availability per size | Critical |
| **Add to cart button** | High contrast, prominent, sticky on mobile | Critical |
| **Star rating** | Average rating + review count visible near price | High |
| **Trust badge** | Free shipping threshold, easy returns, secure checkout | High |

### Product Image Optimization

Images are the #1 conversion driver for baby clothing. Amazon data shows listings with 5+ images have doubled conversion rates.

**Three image categories:**
1. **Professional/Catalog** — White/clean background, for product page and Google Shopping
2. **Lifestyle/Lookbook** — Real scenes matching brand aesthetic (nursery, garden, home)
3. **UGC/Candid** — Customer photos, iPhone-style authenticity for social proof

**Shot list per product:**
1. **Hero image**: On-model (baby wearing the item) — lifestyle context
2. **Detail shots**: Fabric texture close-up, button details, flutter sleeves
3. **Flat lay**: Clean product-only shot on neutral background
4. **Scale shot**: Baby wearing it in real context (crawling, sitting)
5. **Back view**: Show all angles
6. **Size reference**: Compare sizes side by side if possible
7. **Walking/movement shot**: Baby actively moving in the garment (comfort proof)
8. **Macro details**: Stitching, labels, closures up close

**Image specs for Shopify:**
- 2048x2048 square JPEGs for fast loading and mobile optimization
- Compress before upload (Shopify CDN handles some, but start clean)
- AI-generated backgrounds acceptable for variety (e.g., seasonal scenes)

**Image UX:**
- Swipe on mobile, thumbnails on desktop
- Zoom on tap/hover
- 5-8 images minimum per product (4 is too few)
- Load hero image fast (LCP optimization)

### Homepage Hero Section

The hero section must answer three questions in 3 seconds:
1. **What do you sell?**
2. **Who is it for?**
3. **What do I do next?**

**"One Breath Hero" framework:**
- Headline: what you sell + who it's for
- Subheadline: differentiator (e.g., "Elevated everyday pieces for babies 0-24M")
- Proof: social proof bar ("41K families follow us" or "As featured on Nordstrom")
- One clear CTA button with contrasting color

**Hero mistakes to avoid:**
- White text on light backgrounds (contrast is critical)
- Slideshow/carousel heroes — one static hero with one job performs better
- No separate mobile hero image (mobile crops desktop images badly)
- Vague headlines ("New Collection" without context)

### Premium Website Signals

Three things that make a clothing brand look cheap:
1. **Screaming discounts** — Instant discount popups, spinning wheels, countdown timers. Use Klaviyo teaser bar at bottom instead of full-screen popup.
2. **Template-looking design** — Use max two fonts (headline + body), tight color palette (one primary, one neutral, one accent). Do the "blur test": take a scrolling screenshot, blur it, see if it looks cohesive.
3. **Slow pages** — Target 1-2 second load time. Audit app bloat regularly — every app adds code. Keep homepage video to 12 seconds/1080p max.

### Product Description

Follow brand voice (calm, intentional, warm, elevated):

**Structure:**
1. **Opening line** — Emotional hook tied to the occasion or feeling
2. **Key details** — Fabric, design features, available colors
3. **Fabric description** — Tactile, specific (not generic "premium materials")
4. **Sizing guidance** — Brief sizing note with link to full guide
5. **Care instructions** — Brief, link to full care guide
6. **Occasion suggestions** — When to wear this piece

**Example:**
> She was wearing the dusty rose romper the first time she sat up on her own.
>
> Designed with flutter sleeves and a button-front closure, this romper is crafted from our signature cotton — thick enough to feel substantial, soft enough that you notice it. The dusty rose color holds through wash after wash.
>
> Perfect for everyday moments that deserve to feel intentional, or photograph-ready for milestones you'll want to remember.

### Below the Fold

| Element | Purpose | Priority |
|---------|---------|----------|
| **Customer reviews** | Social proof, real photos, specific praise | Critical |
| **Size guide** | Reduce returns, increase confidence | High |
| **"Complete the look"** | Cross-sell matching accessories/sets | High |
| **Recently viewed** | Re-engage browsers | Medium |
| **Shipping info** | Free shipping threshold, delivery timeline | High |
| **Returns policy** | Reduce purchase anxiety | High |
| **Gift wrapping option** | Capture gift buyers | Medium |

### Social Proof Optimization

For premium baby clothing, reviews are critical:

- **Photo reviews** — Babies wearing the item are the best conversion tool
- **Review highlights** — Pull out specific quotes about fabric quality, fit, photo-worthiness
- **Review count** — Display prominently (even 10+ reviews helps)
- **Respond to reviews** — Shows brand engagement
- **Nordstrom reviews** — Reference if applicable ("Loved on Nordstrom too")

### Trust & Confidence Signals

| Signal | Where to Place | Why It Works |
|--------|---------------|-------------|
| Free shipping over $X | Near price + cart | Increases AOV |
| Easy returns | Near add-to-cart | Reduces purchase anxiety |
| Secure checkout | Footer + checkout | Builds trust |
| Ships from Georgia | Product page | Fast delivery signal |
| Black-Owned, Women-Founded | About section or badge | Values alignment |
| "As featured on Nordstrom" | Product page | Third-party validation |

## Mobile-Specific CRO

60%+ of ecommerce traffic is mobile:

- [ ] Sticky add-to-cart button on scroll
- [ ] Easy size selection (large tap targets)
- [ ] Image swipe gallery (not tiny thumbnails)
- [ ] Collapsible sections for description, reviews, shipping
- [ ] Price and availability always visible
- [ ] Express checkout options (Apple Pay, Shop Pay)

## Collection Page CRO

- [ ] Descriptive collection header (not just product grid)
- [ ] Clear product thumbnails with hover preview
- [ ] Quick-add or quick-view without leaving page
- [ ] Filter by size (show only in-stock sizes)
- [ ] Sort by: Bestselling (default), Price, Newest
- [ ] Product cards show: name, price, star rating, color swatches

## CRO Test Ideas (Prioritized)

| Test | Hypothesis | Effort | Impact |
|------|-----------|--------|--------|
| Add photo reviews section | Social proof increases trust | Low | High |
| Sticky add-to-cart on mobile | Reduces friction, increases ATC rate | Low | High |
| Add "Complete the look" section | Cross-sell increases AOV | Medium | High |
| Add free shipping progress bar | Drives AOV above threshold | Low | Medium |
| Gift wrapping option at checkout | Captures gift buyer intent | Medium | Medium |
| Size guide inline (not popup) | Reduces size uncertainty | Low | Medium |
| Add "As seen on Nordstrom" badge | Third-party trust signal | Low | Medium |

## Output

### CRO-ANALYSIS.md
- Current page assessment
- Priority issues (high-impact fixes)
- Specific recommendations with mockup descriptions
- A/B test ideas with hypotheses
- Quick wins (implement this week)

## Related Commands
- `/project:seo-page` — SEO analysis of the same page
- `/project:copywriting` — Product description writing
- `/project:popup-cro` — Exit-intent and email capture popups
- `/project:checkout-cro` — Checkout flow optimization
