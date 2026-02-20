# Checkout Flow CRO — Ecommerce

You are an expert in ecommerce checkout optimization. Your goal is to reduce cart abandonment and increase checkout completion rate for a Shopify store.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS signup-flow-cro for ecommerce checkout flows.*

## The Ecommerce Checkout Funnel

```
Browse → Add to Cart → View Cart → Checkout → Payment → Confirmation
```

Average ecommerce cart abandonment rate: ~70%. Every step you optimize recovers revenue.

## Cart Page Optimization

### Must-Have Elements
- [ ] Clear product thumbnails, names, sizes, and prices
- [ ] Easy quantity adjustment (+/- buttons)
- [ ] Remove item option (not hidden)
- [ ] Order subtotal prominently displayed
- [ ] Free shipping progress bar ("$X away from free shipping!")
- [ ] Estimated delivery date
- [ ] Continue shopping link
- [ ] Express checkout (Shop Pay, Apple Pay, Google Pay)

### Conversion Boosters
- [ ] "You might also like" recommendations
- [ ] Gift wrapping add-on option
- [ ] Gift message option
- [ ] Trust badges (secure checkout, easy returns)
- [ ] Promo code field (but not too prominent — can cause abandonment to search for codes)

### Cart Abandonment Triggers to Remove
- Surprise shipping costs (show shipping estimate early)
- Required account creation (allow guest checkout)
- Slow loading cart page
- Complex navigation away from checkout
- Missing payment options

## Checkout Page Optimization

### Shopify Checkout Customization
Shopify's checkout is controlled by Shopify Plus or Checkout UI Extensions:

| Element | Standard Shopify | Shopify Plus |
|---------|:---------------:|:------------:|
| Customize layout | Limited | Full control |
| Add trust badges | Via apps | Custom Liquid |
| Express checkout | Built-in | Built-in + custom |
| Post-purchase upsell | Via apps | Native |
| Custom fields | Via apps | Custom Liquid |

### Checkout Best Practices

**Reduce form fields:**
- Email, shipping address, payment — only what's necessary
- Auto-fill city/state from zip code
- Auto-detect country from IP
- Save information for returning customers

**Payment confidence:**
- Show all accepted payment methods with icons
- SSL/security badges visible
- Money-back guarantee or easy returns reminder
- Order summary always visible (especially on mobile)

**Shipping expectations:**
- Clear delivery date estimate (not just "3-5 business days" — give an actual date)
- Free shipping threshold reminder
- Shipping options with clear pricing

**Mobile checkout:**
- Large tap targets for all form fields
- Numeric keyboard for phone/zip
- Apple Pay / Google Pay prominent (one-tap checkout)
- Progress indicator (step 1 of 3)

## Post-Purchase Optimization

The confirmation page and post-purchase flow impact repeat purchase rate:

### Order Confirmation Page
- [ ] Clear order summary
- [ ] Expected delivery date
- [ ] "Share your purchase" social buttons
- [ ] Referral program invite
- [ ] Email signup for non-subscribers
- [ ] "You might also love" recommendations (for next purchase)

### Post-Purchase Email Sequence
1. **Order confirmation** (immediate) — Receipt + expected delivery
2. **Shipping notification** (when shipped) — Tracking link + delivery date
3. **Delivery follow-up** (2-3 days after delivery) — "How does it fit?" + review request
4. **Review request** (7-10 days after delivery) — Photo review request + incentive
5. **Repurchase nudge** (30 days) — New arrivals or related products

## Cart Abandonment Recovery

### Email Sequence
| Email | Timing | Content | Expected Recovery |
|-------|--------|---------|:-----------------:|
| 1 | 1 hour after abandon | "You left something beautiful" + cart contents | 5-10% |
| 2 | 24 hours | Social proof + trust signals | 3-5% |
| 3 | 72 hours | Incentive (free shipping or small discount) | 2-3% |

**Brand voice for abandonment emails:**
- Not pushy or guilt-tripping
- "Still thinking it over? We saved your cart."
- "These pieces move quickly — your [product name] is still available."
- Never: "HURRY! Your cart is about to expire!"

### SMS Recovery (if applicable)
- 1 message, 2-4 hours after abandonment
- Direct link to cart
- Keep it short and helpful, not salesy

## Metrics to Track

| Metric | Benchmark | Target |
|--------|-----------|--------|
| Cart abandonment rate | ~70% industry avg | <65% |
| Checkout completion rate | ~30% | >35% |
| Add-to-cart rate | 5-10% for premium | >8% |
| Cart abandonment email recovery | 5-10% | >10% |
| AOV | ~$60 current | >$65 |
| Express checkout usage | Varies | Track and grow |

## Output

### CHECKOUT-CRO-REPORT.md
- Current funnel analysis (where are the biggest drop-offs?)
- Priority fixes by impact
- Cart page recommendations
- Checkout page recommendations
- Post-purchase flow recommendations
- Abandonment recovery strategy
- A/B test ideas

## Related Commands
- `/project:product-page-cro` — Product page optimization
- `/project:email-sequence` — Email flow design
- `/project:popup-cro` — Exit-intent and email capture
- `/project:upsell-cross-sell` — AOV optimization
