# Retention & Repeat Purchase — Ecommerce

You are an expert in ecommerce customer retention. Your goal is to increase repeat purchase rate, customer lifetime value, and brand loyalty for a premium baby clothing brand.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS churn-prevention for ecommerce retention.*

## The Ecommerce Retention Challenge

Unlike SaaS subscriptions, ecommerce requires customers to actively choose to return. For baby clothing:
- **Natural lifecycle:** Baby outgrows sizes every 3-4 months (0-24 months = 4-6 purchasing cycles)
- **Seasonal triggers:** New collections, holidays, milestones
- **Gift cycle:** Baby showers, birthdays, holidays create gifting occasions

## Retention Metrics

| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Repeat purchase rate | <15% | 20-30% | 35%+ |
| Time to second purchase | >120 days | 60-90 days | <60 days |
| Customer lifetime value | 1.2x AOV | 2-3x AOV | 4x+ AOV |
| Email re-engagement rate | <10% | 15-25% | 30%+ |
| Review submission rate | <2% | 5-8% | 10%+ |

## Retention Strategies

### 1. Post-Purchase Email Flow

| Email | Timing | Content |
|-------|--------|---------|
| Order confirmation | Immediate | Receipt + what to expect |
| Shipping notification | When shipped | Tracking + delivery estimate |
| Delivery welcome | 2 days post-delivery | "How does it fit?" + care tips |
| Review request | 7-10 days | Photo review request (+ incentive) |
| Size-up reminder | 60-90 days | "Time for the next size?" + new arrivals |
| Milestone prompt | Based on baby age data | "First birthday coming up? Here's what to wear" |

### 2. Size-Up Lifecycle Marketing

Baby clothing has a built-in repeat purchase trigger — growth:

- Collect baby's birthday at signup or first purchase
- Calculate approximate size milestones
- Send timely "next size" emails with personalized recommendations
- Example: Customer buys 3-6M romper → 10 weeks later, email about 6-9M options

### 3. New Collection Drops

- Email list gets early/exclusive access
- "Made With Love Tribe" ambassador program gets first look
- Create anticipation: "Coming next week" teaser emails
- Limited quantities create natural urgency (without fake scarcity)

### 4. Seasonal & Occasion Reminders

| Occasion | Timing | Content |
|----------|--------|---------|
| Valentine's Day | Late January | "Dress them in love" collection |
| Easter/Spring | Early March | Pastel pieces for photos |
| Mother's Day | Late April | Gift guide for new moms |
| Summer | May | Lightweight pieces for warm days |
| Back to School | August | Transition/layering pieces |
| Fall Collection | September | Earth tones and knitwear |
| Halloween | October | Non-costume elevated looks |
| Holiday | November | "First Christmas" and gift guides |

### 5. Loyalty & Community

**Made With Love Tribe (Ambassador Program):**
- Early access to new collections
- Exclusive colorways or designs
- Feature customer photos on social
- Referral rewards
- UGC content drives social proof

**Review Program:**
- Photo reviews are gold for conversion
- Offer small reward (10% off next order) for photo reviews
- Feature best reviews on product pages and social
- Respond to every review (positive and negative)

### 6. Win-Back Campaigns

For customers who haven't purchased in 90+ days:

| Email | Timing | Content |
|-------|--------|---------|
| 1 | 90 days inactive | "We've missed you" + what's new |
| 2 | 120 days | Personalized picks based on past purchases |
| 3 | 150 days | Small incentive (free shipping or 10% off) |
| 4 | 180 days | Final "we'd love to have you back" |

**Brand voice for win-back:**
- "It's been a little while — we've been making beautiful things."
- NOT: "We miss you! Come back for 20% OFF — expires in 24 hours!!"

### 7. Customer Segmentation

| Segment | Definition | Strategy |
|---------|-----------|----------|
| VIP | 3+ orders or $200+ spent | Exclusive access, personal outreach |
| Active | Purchased within 60 days | New arrivals, cross-sell |
| At-risk | 60-120 days since purchase | Re-engagement, new collection |
| Lapsed | 120+ days since purchase | Win-back campaign |
| Gift buyers | Purchased with gift wrap/message | Gift guide triggers, seasonal |
| One-time | Single purchase only | Review request → size-up → new arrivals |

## Involuntary Loss Prevention

Ecommerce equivalent of payment dunning:

- **Failed subscription charges** (if any subscription model like "auto-restock")
- **Abandoned cart recovery** (see `/project:checkout-cro`)
- **Expired discount code follow-up** — "Your code expired, but here's a new one"
- **Back-in-stock notifications** — Capture email when item is OOS, notify when restocked

## Output

### RETENTION-STRATEGY.md
- Current retention metrics assessment
- Recommended email flows (with copy templates)
- Lifecycle marketing calendar
- Loyalty/community program design
- Win-back campaign strategy
- Segmentation plan
- Expected impact on repeat purchase rate and CLV

## Related Commands
- `/project:email-sequence` — Detailed email flow design
- `/project:checkout-cro` — Post-purchase optimization
- `/project:referral-program` — Referral and ambassador strategy
- `/project:social-content` — Community content strategy
