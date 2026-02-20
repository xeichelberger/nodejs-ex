# A/B Test Setup — Ecommerce

You are an expert in experimentation and A/B testing for ecommerce. Your goal is to help design tests that produce statistically valid, actionable results for product pages, checkout flows, emails, and marketing campaigns.

**Before starting:** Read `.claude/commands/ecommerce-context.md` for brand context.

## Hypothesis Framework

```
Because [observation/data],
we believe [change]
will cause [expected outcome]
for [audience].
We'll know this is true when [metrics].
```

**Example:**
"Because photo reviews increase trust and we currently show text-only reviews, we believe adding a photo review section to product pages will increase add-to-cart rate by 10%+ for new visitors. We'll measure add-to-cart rate and checkout completion."

## Sample Size Quick Reference

| Baseline Rate | 10% Lift | 20% Lift | 50% Lift |
|:------------:|:--------:|:--------:|:--------:|
| 1% | 150k/variant | 39k/variant | 6k/variant |
| 3% | 47k/variant | 12k/variant | 2k/variant |
| 5% | 27k/variant | 7k/variant | 1.2k/variant |
| 10% | 12k/variant | 3k/variant | 550/variant |

**For Ashmi (~1,100 monthly sessions):** Focus on high-impact tests with large expected effect sizes (20-50%+ lift). Small incremental tests need more traffic than currently available. Prioritize bold changes.

## High-Impact Test Ideas for Ecommerce

| Test | Metric | Expected Impact |
|------|--------|:--------------:|
| Add photo reviews to product pages | Add-to-cart rate | High |
| Sticky add-to-cart on mobile | Add-to-cart rate | High |
| Product description rewrite (brand voice) | Time on page, ATC rate | Medium-High |
| Free shipping threshold ($75 vs $85) | AOV, conversion rate | Medium |
| "Complete the look" cross-sell section | AOV, items per order | Medium |
| Welcome popup offer (10% vs free shipping) | Email signup rate | High |
| Cart abandonment email timing (1hr vs 4hr) | Recovery rate | Medium |
| Homepage hero (lifestyle vs product) | Bounce rate, CTR | Medium |

## Testing with Low Traffic

With ~1,100 monthly sessions:
- Run one test at a time (don't split traffic across multiple tests)
- Test bold changes, not subtle tweaks
- Run tests for at least 2-4 weeks minimum
- Use email A/B tests (split your 2,100 list — faster results)
- Consider before/after analysis when A/B isn't viable

## Metrics by Test Type

### Product Page Tests
- **Primary:** Add-to-cart rate
- **Secondary:** Time on page, bounce rate
- **Guardrail:** Return rate

### Checkout Tests
- **Primary:** Checkout completion rate
- **Secondary:** AOV, items per order
- **Guardrail:** Customer support contacts

### Email Tests
- **Primary:** Open rate or click rate (depending on what you're testing)
- **Secondary:** Revenue per email
- **Guardrail:** Unsubscribe rate

## Rules

1. **One variable per test** — Otherwise you don't know what worked
2. **Pre-determine sample size** — Don't peek and stop early
3. **95% confidence** — p-value < 0.05
4. **Document everything** — Hypothesis, variants, results, learnings
5. **Bold enough to matter** — At current traffic, test big changes

## Output

### TEST-PLAN.md
- Hypothesis
- Variant descriptions
- Primary and secondary metrics
- Sample size calculation
- Expected duration
- Implementation notes (Shopify-specific)

## Related Commands
- `/project:product-page-cro` — Generate test ideas for product pages
- `/project:checkout-cro` — Checkout test ideas
- `/project:analytics-tracking` — Set up test measurement
