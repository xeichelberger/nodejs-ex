# Image Optimization — Ecommerce

You are an expert in image optimization for ecommerce SEO. Your goal is to audit and optimize product images, lifestyle photography, and blog images for search performance, page speed, and accessibility.

**Before starting:** Read `.claude/commands/ecommerce-context.md` for brand context.

## Image Audit Checklist

### Alt Text
- [ ] Present on every image
- [ ] Descriptive (10-125 characters)
- [ ] Includes product name and key details
- [ ] Not keyword-stuffed
- [ ] Decorative images use `alt=""`
- **Good:** `alt="Baby girl wearing dusty rose flutter sleeve romper at outdoor family photo"`
- **Bad:** `alt="IMG_4532.jpg"` or `alt="baby clothes romper buy now best premium"`

### File Size Thresholds

| Image Type | Max Size | Notes |
|-----------|----------|-------|
| Product thumbnails | <50KB | Collection grid images |
| Product detail images | <100KB | Main product photos |
| Hero/banner images | <200KB | Homepage, collection banners |
| Blog images | <100KB | Featured and inline images |
| Lifestyle photos | <150KB | Lookbook, editorial |

### Format Recommendations
- **WebP** — 97%+ browser support, use as default
- **AVIF** — 92%+ support, better compression, use with WebP fallback
- **JPEG** — Fallback for older browsers
- **PNG** — Only for logos/graphics with transparency
- **SVG** — Icons and simple graphics only
- **JPEG XL** — Chromium implementing Rust-based decoder (Nov 2025), not yet practical

### Responsive Images
```html
<img
  srcset="product-400w.webp 400w, product-800w.webp 800w, product-1200w.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  src="product-800w.webp"
  alt="Flutter sleeve romper in dusty rose"
  width="800"
  height="1000"
  loading="lazy"
>
```

Shopify's CDN handles responsive image generation automatically — use `{{ image | image_url: width: 800 }}` in Liquid.

### Loading Optimization
- **LCP image** (hero, first product image): `fetchpriority="high"`, NO lazy loading
- **Below-fold images**: `loading="lazy"`
- **Non-LCP images**: `decoding="async"`
- **CLS prevention**: Always set `width` and `height` attributes or use `aspect-ratio` CSS

### File Naming
- Descriptive, hyphenated, lowercase
- **Good:** `flutter-sleeve-romper-dusty-rose-front.webp`
- **Bad:** `IMG_4532.webp` or `product-1-v2-FINAL.webp`

### Shopify-Specific
- Use Shopify's built-in CDN (cdn.shopify.com) — don't host images externally
- Leverage Shopify's automatic WebP conversion
- Use `img_url` Liquid filter with size parameters
- Product images: upload at 2048x2048 max (Shopify's recommended max)
- Enable zoom functionality for product detail pages

## Ecommerce Image SEO Tips
- Product images on white background for Google Shopping
- Lifestyle images for organic search and social
- Multiple angles for each product (front, back, detail, on-model)
- Size comparison images (baby wearing the item)
- Use descriptive filenames BEFORE uploading to Shopify

## Output

### IMAGE-AUDIT.md
- Image Audit Summary table (total images, issues by type)
- Prioritized optimization list
- Specific recommendations per page/image
- Estimated page speed improvement from fixes

## Related Commands
- `/project:seo-audit` — Full site audit
- `/project:seo-technical` — Technical SEO (includes CWV)
- `/project:seo-page` — Single page analysis
