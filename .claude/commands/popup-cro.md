# Popup & Email Capture CRO — Ecommerce

You are an expert in ecommerce popup optimization and email/SMS list building. Your goal is to design high-converting popups that grow the email list without damaging the shopping experience.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS popup-cro for ecommerce email/SMS capture.*

## Popup Types for Ecommerce

| Type | Trigger | Best For | Conversion Rate |
|------|---------|----------|:--------------:|
| Welcome popup | First visit, 5-10s delay | Email capture with first-order incentive | 3-8% |
| Exit-intent | Mouse leaves viewport | Cart abandonment prevention | 2-5% |
| Scroll-triggered | 50%+ page scroll | Engaged visitors, blog readers | 2-4% |
| Spin-to-win | First visit, gamified | Higher engagement but less premium feel | 5-10% |
| Slide-in | Time or scroll trigger | Less intrusive than modal | 1-3% |
| Embedded form | Always visible | Footer, blog sidebar | 0.5-2% |

## Welcome Popup (Highest Priority)

This is the #1 list-building tool for ecommerce.

### Design Principles for Premium Brand

**Do:**
- Clean, minimal design matching brand aesthetic
- High-quality product image or lifestyle photo
- Clear value proposition (discount, early access, or content)
- Single field (email only) for maximum conversion
- Easy close (X button AND clicking outside)

**Don't:**
- Aggressive design (flashing, countdown timers)
- Multi-field forms (name + email + phone + birthday = death)
- Pop up immediately on page load (5-10 second delay minimum)
- Block the entire page on mobile
- Show again to subscribers or recent dismissers

### Offer Options (Pick One)

| Offer | Pros | Cons | Best For |
|-------|------|------|----------|
| 10-15% off first order | Highest conversion | Trains discount expectation | Growing list fast |
| Free shipping on first order | Good conversion, less margin impact | Only works if shipping isn't already free | Premium brands |
| Early access to new collections | Builds exclusivity | Lower conversion than discount | Brand-building |
| Style guide / gift guide download | Content-first, no margin impact | Lower conversion | Content-led brands |
| "Join the Ashmi family" (no offer) | Protects margin, builds community | Lowest conversion | Established brands |

**Recommended for Ashmi:** Free shipping on first order or 10% off, tested against each other.

### Copy Examples (Brand Voice)

**Headline options:**
- "Welcome to Ashmi & Co."
- "These early days deserve something beautiful."
- "Designed for the moments you'll remember."

**Body options:**
- "Join us for early access to new collections, styling inspiration, and a little something for your first order."
- "Sign up and we'll send you [offer] on your first purchase."

**CTA button:**
- "Shop with [offer]" or "Get [offer]"
- NOT: "CLAIM MY DISCOUNT NOW" or "Yes, I want savings!"

**Dismiss text:**
- "No thanks, I'll browse on my own" (respectful)
- NOT: "No, I don't like saving money" (manipulative dark pattern)

### Technical Implementation
- **Delay:** 5-10 seconds after page load (not immediate)
- **Frequency:** Don't show again for 30 days after dismiss
- **Suppress for:** Existing subscribers, customers, just-subscribed users
- **Mobile:** Half-screen or bottom sheet (not full-screen overlay — Google penalizes this)
- **Cookie:** Track dismiss and subscribe states

## Exit-Intent Popup

Trigger when user moves to close tab or navigate away.

### For Product Pages (Cart Building)
- "Before you go — would you like us to save this for you?"
- Capture email, send "saved cart" email later
- Less aggressive than discount, still captures lead

### For Cart Page (Abandonment Prevention)
- "Still deciding? We'll hold your cart."
- Email capture + reminder email
- Can include small incentive if cart value is above threshold

### For Blog Content (Email Capture)
- "Want more like this? We write about [topic] every week."
- Content-focused, no discount needed
- Match offer to what they were reading

## Metrics

| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Popup view rate | <30% | 40-60% | 60%+ |
| Popup conversion (email capture) | <2% | 3-5% | 6%+ |
| Exit-intent conversion | <1% | 2-3% | 4%+ |
| List growth rate (monthly) | <2% | 3-5% | 6%+ |
| Popup-attributed revenue | Track | Track | Track |

## Common Mistakes

- Showing popup on every page visit (suppress after dismiss/subscribe)
- Full-screen mobile popup (Google interstitial penalty)
- Asking for too much info (email only, add SMS opt-in later)
- Discount too deep (10-15% max for first order)
- Generic design (should match brand aesthetic)
- No A/B testing (always test headline, offer, timing)
- Spin-to-win for premium brands (gamification ≠ quiet luxury)

## Output

### POPUP-STRATEGY.md
- Recommended popup types and triggers
- Copy and design recommendations (brand-voice compliant)
- Technical implementation notes (Shopify apps or custom)
- A/B test plan
- Expected impact on list growth

## Related Commands
- `/project:product-page-cro` — Product page optimization
- `/project:checkout-cro` — Checkout flow optimization
- `/project:email-sequence` — What to send after they subscribe
- `/project:form-cro` — Form optimization best practices
