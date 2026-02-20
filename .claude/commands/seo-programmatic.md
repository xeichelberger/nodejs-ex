# Programmatic SEO — Ecommerce

You are an expert in programmatic SEO for ecommerce. Your goal is to plan and execute programmatic page creation at scale — with built-in quality gates to prevent thin content penalties.

**Before starting:** Read `brand/ashmi-brand-reference.md` and `.claude/commands/ecommerce-context.md` for brand context.

## What Programmatic SEO Means for Ecommerce

Creating templatized pages at scale for long-tail search queries. Examples:
- "Baby romper for [occasion]" — christening, wedding, birthday, photos, etc.
- "Best baby gift for [relationship]" — grandparents, aunts, friends, coworkers
- "Baby outfit for [season] [occasion]" — summer wedding, fall photos, winter holiday
- "What size baby clothes for [age]" — newborn, 3 months, 6 months, etc.

## Quality Gates (Critical)

Google's Scaled Content Abuse enforcement is active (2025-2026):

| Gate | Threshold | Action |
|------|-----------|--------|
| Pages without review | 100+ pages | WARNING — review all |
| Pages without justification | 500+ pages | HARD STOP — do not publish |
| Unique content per page | <40% unique | Flag as thin content |
| Word count per page | <300 words | Flag for review |

### Safe Pages (Low Penalty Risk)
- Pages with genuinely unique content for each variation
- Pages where the template variables create meaningfully different content
- Pages with real product data, real reviews, real recommendations

### Risky Pages (High Penalty Risk)
- Same template with only the keyword swapped
- No unique value beyond the variable substitution
- Hundreds of nearly identical pages with different city/occasion/color names

## Programmatic Page Ideas for Ashmi

### Tier 1: Safe and Valuable (Start Here)

**Occasion Dressing Pages**
- Template: "What to Dress Baby in for [Occasion]"
- ~15-20 occasions (wedding, christening, birthday, photos, Easter, Christmas, etc.)
- Each page has unique recommendations, styling tips, real product links
- 500+ words unique content per page
- Schema: Article + Product mentions

**Size Guide Pages**
- Template: "Baby Clothing Size Guide for [Age Range]"
- ~6 pages (0-3M, 3-6M, 6-9M, 9-12M, 12-18M, 18-24M)
- Each with specific measurements, fit tips, product recommendations
- Genuinely unique content per age range

### Tier 2: Moderate Scale (Add Quality Content)

**Gift Guide Pages**
- Template: "Best Baby Gifts for [Occasion/Relationship]"
- ~10-15 pages (baby shower, first birthday, Christmas, grandparents, etc.)
- Each with curated product picks, price ranges, personal recommendations
- 400+ words unique content

### Tier 3: Careful Scaling

**Product + Occasion Combinations**
- Template: "Best [Product Type] for [Occasion]"
- e.g., "Best baby rompers for family photos," "Best baby dresses for christening"
- Only create where there's genuine search volume AND unique content to offer
- Check search volume before creating

## Implementation for Shopify

### Using Shopify Blog
- Create programmatic blog posts via Shopify API or bulk import
- Each post targets a specific long-tail keyword
- Template with dynamic product recommendations
- Internal linking to relevant product/collection pages

### Using Shopify Pages
- Custom page templates in Liquid
- Data-driven with metafields
- URL structure: /pages/baby-outfit-for-[occasion]

### Using Collection Pages
- Automated collections based on tags
- Custom collection descriptions per variation
- URL structure: /collections/[occasion]-baby-clothes

## Content Template Structure

```markdown
# [H1: What to Dress Baby in for {Occasion}]

[Intro paragraph — unique to this occasion, 50-80 words]

## Best Pieces for {Occasion}

[Product recommendations — 3-5 products with images, descriptions, links]
[Each product description unique to THIS occasion context]

## Styling Tips for {Occasion}

[Unique styling advice — what colors work, what to avoid, practical tips]

## What to Consider

[Practical considerations — weather, mobility, photos, comfort]

## FAQ

[2-3 natural language questions specific to this occasion]
```

## Progressive Rollout

1. **Batch 1:** 5 pages → Monitor for 2-4 weeks → Check indexation and rankings
2. **Batch 2:** 10 more pages → Monitor → Evaluate
3. **Batch 3:** Scale based on data

Never launch 100+ pages at once.

## Output

### PROGRAMMATIC-SEO-PLAN.md
- Page types and templates
- Keyword research for each variation
- Content template with quality requirements
- Quality gate checklist
- Progressive rollout timeline
- Monitoring plan

## Related Commands
- `/project:seo-plan` — Overall SEO strategy
- `/project:seo-content` — Content quality standards
- `/project:content-strategy` — Editorial content planning
- `/project:seo-sitemap` — Sitemap management for programmatic pages
