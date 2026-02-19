# ClawdSEOBot - Shopify SEO App

## Shopify Dev Quick Reference

### First-time setup for a new Shopify app:
1. `npm install` — install dependencies
2. Go to https://dev.shopify.com and create an app in your org (Uyo)
3. Copy the `client_id` into `shopify.app.toml`
4. Create a dev store at https://dev.shopify.com/dashboard/129341719/stores if you don't have one
5. `npx @shopify/cli app dev` — starts the dev server (handles tunneling automatically, no ngrok needed)

### Daily dev workflow:
```bash
cd ~/nodejs-ex && npx @shopify/cli app dev
```
Then press `p` to preview in browser.

### Current config:
- **Org:** Uyo (ID: 129341719)
- **App:** ClawdSEOBot
- **Dev store:** ashmi-dev.myshopify.com
- **App server:** localhost:8080
- **GraphiQL:** localhost:3457

### Key files:
- `shopify.app.toml` — Shopify app config (client_id, scopes, URLs)
- `server.js` — Main Express app
- `views/` — EJS templates
- `public/` — Static assets (CSS, JS, images)

### To create another Shopify app for this or another store:
1. Go to https://dev.shopify.com → your org → "Create app"
2. Copy new `client_id`
3. Create a new project directory or duplicate this one
4. Update `shopify.app.toml` with the new client_id and app name
5. Run `npx @shopify/cli app dev` — it will auto-detect the config

### Scopes:
read_products, write_products, read_content, write_content, read_themes, read_script_tags, write_script_tags
