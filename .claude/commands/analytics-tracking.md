# Analytics & Tracking — Ecommerce

You are an expert in ecommerce analytics implementation. Your goal is to set up tracking that provides actionable insights for marketing and conversion optimization decisions.

**Before starting:** Read `.claude/commands/ecommerce-context.md` for brand context.

## Essential Ecommerce Events

### Shopify + GA4 Core Events

| Event | Trigger | Properties |
|-------|---------|-----------|
| `page_view` | Every page load | page_title, page_location |
| `view_item` | Product page view | item_id, item_name, price, category |
| `view_item_list` | Collection page view | item_list_name, items[] |
| `add_to_cart` | Add to cart click | item_id, item_name, price, quantity |
| `remove_from_cart` | Remove from cart | item_id, item_name, price |
| `begin_checkout` | Checkout started | items[], value, currency |
| `add_shipping_info` | Shipping step | shipping_tier |
| `add_payment_info` | Payment step | payment_type |
| `purchase` | Order completed | transaction_id, value, items[], shipping, tax |
| `view_cart` | Cart page view | items[], value |

### Custom Events to Add

| Event | Trigger | Why |
|-------|---------|-----|
| `email_signup` | Popup or form submit | Track list growth source |
| `size_guide_viewed` | Size guide opened | Correlate with conversion |
| `review_read` | Review section scrolled to | Social proof engagement |
| `quick_view_opened` | Quick view on collection | Product discovery |
| `gift_wrap_added` | Gift wrapping selected | Gift buyer segment |
| `cross_sell_clicked` | "Complete the look" click | Cross-sell effectiveness |
| `free_shipping_threshold` | Cart reaches threshold | AOV optimization |

## UTM Strategy

| Parameter | Convention | Examples |
|-----------|-----------|---------|
| utm_source | Platform name | instagram, pinterest, klaviyo, google |
| utm_medium | Channel type | social, email, organic, cpc |
| utm_campaign | Campaign name | welcome_series, spring_launch, influencer_gifting |
| utm_content | Specific creative | hero_cta, email_2, carousel_3 |

**Examples:**
- Email welcome series: `?utm_source=klaviyo&utm_medium=email&utm_campaign=welcome_series&utm_content=email_2`
- Instagram bio link: `?utm_source=instagram&utm_medium=social&utm_campaign=bio_link`
- Blog post CTA: `?utm_source=blog&utm_medium=content&utm_campaign=wedding_dress_guide&utm_content=inline_cta`

## Key Dashboards to Build

### 1. Revenue Dashboard
- Total revenue (daily, weekly, monthly)
- Revenue by channel (organic, email, social, direct)
- AOV trend
- Conversion rate trend
- New vs returning customer revenue

### 2. Product Performance
- Top products by revenue and units
- Product page views → add to cart → purchase funnel
- Category/collection performance
- Size distribution (helps inventory planning)

### 3. Customer Acquisition
- Traffic by source/medium
- Email signup rate by source
- First-time vs repeat purchase
- Customer acquisition cost (when ads start)

### 4. Content Performance
- Blog traffic by post
- Blog → product click-through rate
- Email open rates and click rates by flow
- Social referral traffic

## Tools

| Tool | Use For | Priority |
|------|---------|---------|
| **GA4** | Web analytics, traffic, conversion tracking | Must-have |
| **Google Search Console** | SEO performance, keyword rankings | Must-have |
| **Klaviyo** (or similar) | Email analytics, flow performance | Must-have |
| **Shopify Analytics** | Revenue, orders, product performance | Built-in |
| **Google Tag Manager** | Event tracking management | Recommended |
| **Hotjar/Lucky Orange** | Heatmaps, session recordings | Nice-to-have |
| **Pinterest Analytics** | Pin performance, traffic | For Pinterest strategy |

## Output

### TRACKING-PLAN.md
- Event list with properties and triggers
- UTM convention documentation
- GA4 setup instructions (Shopify-specific)
- Dashboard specifications
- Privacy/consent considerations

## Related Commands
- `/project:ab-test-setup` — Experiment tracking
- `/project:seo-audit` — Technical SEO (includes analytics checks)
- `/project:product-page-cro` — What to track for CRO
