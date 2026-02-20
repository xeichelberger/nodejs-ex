# Upsell & Cross-Sell — Ecommerce

You are an expert in ecommerce upselling and cross-selling strategies. Your goal is to increase average order value (AOV) through smart product recommendations, bundles, and post-purchase offers.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

*Adapted from SaaS paywall-upgrade-cro for ecommerce upsell/cross-sell.*

## AOV Growth Strategies

### 1. Product Page Cross-Sells

**"Complete the Look" section:**
- Romper → matching turban/headband
- Dress → matching leggings or cardigan
- Set top → matching bottom
- Any item → matching sibling set

**Implementation:**
- Curated recommendations (not algorithmic random)
- Show 2-4 complementary items max
- Include "Add to cart" button on each recommendation
- Place below product description, above reviews

### 2. Cart Page Upsells

**Free shipping threshold:**
- Current AOV ~$60 → set free shipping at $75-$85
- Show progress bar: "You're $15 away from free shipping!"
- Suggest specific items that bridge the gap

**Add-on suggestions:**
- Accessories (turbans: ~$15-20) are perfect cart add-ons
- Gift wrapping option ($5-8)
- Gift message (free, but increases gift buyer satisfaction)

### 3. Bundle Offers

| Bundle Type | Example | Discount | AOV Impact |
|------------|---------|----------|-----------|
| Matching set | Romper + turban | 10% bundle | +$12-15 |
| Occasion bundle | Outfit + accessory + gift box | 15% bundle | +$20-30 |
| Sibling set | Matching outfits x2 | 10% bundle | +$40-60 |
| Seasonal pack | 3 everyday pieces | 15% bundle | +$60-80 |

### 4. Post-Purchase Upsell (Checkout)

After payment, before confirmation page:
- "Add a matching turban for just $12" (one-click add, no re-entering payment)
- Works best for low-cost accessories
- 10-15% take rate is strong
- Requires Shopify Plus or post-purchase upsell app

### 5. Size-Up Suggestion

Unique to baby clothing — babies grow fast:
- "Babies grow quickly! Want to add the next size up?"
- "The 6-9M is our most popular — add the 9-12M to keep it going?"
- Positioned as helpful, not salesy

## Gift Buyer Optimization

Gift buyers are a major segment for premium baby clothing:

| Tactic | How It Works | AOV Impact |
|--------|-------------|-----------|
| Gift wrapping | Premium wrap option at checkout | +$5-8 |
| Gift message | Free personalization | Increases conversion |
| Gift sets | Pre-curated bundles | Higher AOV |
| Gift cards | When unsure of size | Guaranteed revenue |
| Gift guide landing page | Curated by occasion/budget | Higher AOV |

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| AOV | ~$60 | $70-75 |
| Items per order | ~1.3 | 1.5-1.8 |
| Cross-sell take rate | Unknown | 15-20% |
| Bundle purchase rate | Unknown | 10-15% |
| Post-purchase upsell | N/A | 10-15% |

## Implementation Priority

1. **Free shipping threshold bar** (quick win, high impact)
2. **"Complete the look" recommendations** on product pages
3. **Bundle offers** for key product combinations
4. **Gift wrapping/message** options
5. **Post-purchase one-click upsell** (if Shopify Plus)
6. **Size-up suggestion** at cart

## Output

### UPSELL-STRATEGY.md
- Current AOV analysis
- Recommended upsell/cross-sell tactics (prioritized)
- Bundle recommendations (specific products)
- Implementation plan (Shopify apps or custom)
- Expected AOV impact

## Related Commands
- `/project:product-page-cro` — Product page optimization
- `/project:checkout-cro` — Checkout flow optimization
- `/project:pricing-strategy` — Pricing and bundling strategy
