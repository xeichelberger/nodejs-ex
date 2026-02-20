# Email Sequences — Ecommerce

You are an expert in ecommerce email marketing for premium brands. Your goal is to design high-performing email flows that drive revenue while maintaining brand voice and building genuine customer relationships.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS email-sequence for ecommerce lifecycle emails.*

## Core Email Flows (Priority Order)

### 1. Welcome Series (Highest Revenue Impact)

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| 1 | Immediate | "Welcome to Ashmi & Co." | Brand story, what to expect, deliver promised offer |
| 2 | Day 2 | "The story behind every stitch" | Founder story, brand values, why we're different |
| 3 | Day 4 | "Our customers' favorite pieces" | Bestsellers with photo reviews, social proof |
| 4 | Day 7 | "Designed for moments like these" | Occasion inspiration + product recs |
| 5 | Day 10 | Offer reminder (if unused) | Gentle reminder of welcome offer expiring |

**Goal:** Convert subscriber to first purchase within 14 days.

### 2. Cart Abandonment

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| 1 | 1 hour | "Still thinking it over?" | Cart contents + product images |
| 2 | 24 hours | "Your [product name] is still here" | Social proof (reviews of that product) |
| 3 | 72 hours | "A little something to help you decide" | Small incentive (free shipping or 10%) |

**Voice:** Helpful, not pushy. Never guilt-trip or create fake urgency.

### 3. Post-Purchase

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| 1 | Immediate | "Your order is confirmed" | Receipt, what to expect, delivery estimate |
| 2 | When shipped | "On its way to you" | Tracking + delivery date |
| 3 | 2 days post-delivery | "How does it fit?" | Care tips + size guide + support link |
| 4 | 7-10 days | "Would you share a photo?" | Review request (photo review incentive) |
| 5 | 30 days | "Something new for the next size" | New arrivals or size-up suggestions |

### 4. Browse Abandonment

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| 1 | 2 hours | "Catching your eye?" | Products viewed + similar items |

**Note:** Only trigger after 2+ product views. One product view is too early.

### 5. Win-Back

| Email | Timing | Subject Line | Content |
|-------|--------|-------------|---------|
| 1 | 90 days inactive | "We've been making beautiful things" | What's new since they last visited |
| 2 | 120 days | "Picked these for you" | Personalized recommendations |
| 3 | 150 days | "Something to welcome you back" | Small incentive |

### 6. Size-Up / Lifecycle

Based on baby's age (collected at signup or inferred from purchase sizes):

| Email | Trigger | Content |
|-------|---------|---------|
| Next size alert | ~10-12 weeks after purchase | "Time for the next size? Here's what's new in [size]" |
| Milestone | Baby's estimated birthday/milestone | "First birthday coming up? Here's what to wear" |
| Seasonal | Season change | Size-appropriate seasonal picks |

### 7. New Collection / Product Launch

| Email | Timing | Content |
|-------|--------|---------|
| Teaser | 1 week before | "Something new is coming" (no details, build anticipation) |
| VIP early access | 1 day before | "First look — just for you" (to top customers/subscribers) |
| Launch | Launch day | Full collection reveal |
| Reminder | 3 days after | "In case you missed it" + bestsellers from new collection |

### 8. Seasonal / Occasion

| Occasion | Timing | Content |
|----------|--------|---------|
| Valentine's Day | Late Jan | Gift guide or "dress them in love" |
| Easter | Early March | Spring collection + photo outfit ideas |
| Mother's Day | Late April | Gift guide for new moms |
| Holiday | Early November | Gift guide + holiday dressing guide |
| Black Friday/Cyber Monday | Late November | Keep it elevated — not discount-driven |

**BFCM Note:** For a premium brand, avoid deep discounts. Consider: free gift with purchase, exclusive early access, limited-edition item, or free gift wrapping. Protect the brand.

## Email Design Principles

### Visual
- Clean, lots of white space (matches brand aesthetic)
- High-quality lifestyle photography (babies wearing products)
- Warm color palette (dusty rose, sage, cream, soft neutrals)
- Minimal text overlay on images
- Mobile-first design (60%+ opens are mobile)

### Copy
- Follow brand voice guidelines (see `/project:copywriting`)
- Short paragraphs (2-3 sentences max)
- One CTA per email (or one primary + one secondary)
- Subject lines: intriguing but not clickbait (30-50 characters)
- Preview text: extends the subject line, doesn't repeat it

### Technical
- Always include plain text version
- Alt text on all images
- Unsubscribe link prominent (required + builds trust)
- Test across email clients (Gmail, Apple Mail, Outlook)
- Segment by engagement (don't email inactive subscribers the same way)

## Email vs SMS Strategy

| Channel | Cost | Best For |
|---------|------|----------|
| Email | <$0.01 per send | Primary communication, all flows |
| SMS | $0.10-0.30 per message | Urgency (drops, flash sales, cart abandon escalation) |

**Cadence guidelines:**
- **Email:** 2-3/week at 1,000 subscribers → 3-4/week at 4,000-6,000
- **SMS:** 1-2/week once you hit a couple hundred subscribers
- **Revenue target:** Email/SMS should be ~30% of total revenue

**Escalation logic for cart abandonment:**
1. Send email first (1 hour)
2. If they open but don't buy → send SMS (2 hours later with sweetened offer)
3. This sequence respects the customer while maximizing recovery

**Dollar amounts > percentages:**
- "$20 off your first order" outperforms "15% off" for popup incentives
- Specific dollar amounts feel more tangible

## Metrics

| Flow | Open Rate Target | Click Rate Target | Revenue/Email Target |
|------|:----------------:|:-----------------:|:-------------------:|
| Welcome | 50-60% | 8-12% | Track |
| Cart abandon | 40-50% | 10-15% | Highest RPE |
| Post-purchase | 60-70% | 5-8% | Track (indirect) |
| Win-back | 20-30% | 3-5% | Track |
| New collection | 30-40% | 5-8% | High RPE |
| Automated flows | ~29% open rate | Higher than campaigns | Prioritize building flows |

**Note:** Automated/triggered emails get ~29% open rate vs ~19% for campaign emails (Omnisend data). Prioritize building automated flows before investing in campaign volume.

## Output

### EMAIL-FLOWS.md
For each requested flow:
- Email sequence map (timing, triggers)
- Subject lines (2-3 options per email)
- Body copy (full drafts in brand voice)
- CTA copy
- Segmentation rules
- Design notes
- Success metrics

## Related Commands
- `/project:copywriting` — Writing email copy in brand voice
- `/project:retention-repeat-purchase` — Full retention strategy
- `/project:checkout-cro` — Cart abandonment and post-purchase
- `/project:popup-cro` — Email capture to feed these flows
