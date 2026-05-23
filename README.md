# Karat — Jewellery Inventory Portal

A premium React web app for jewellery owners to manage their inventory, customers, and analytics.

## Features
- 🔐 Google OAuth login (Supabase Auth)
- 🏪 Role-based access (active store check, pending approval screen)
- 💎 Full inventory CRUD with multi-image slideshow cards
- 🔍 Smart search: SKU, name, gold type, diamond, material, occasion
- 🔽 Advanced filters: stock status, gold carat
- ↕️ Sort: newest, price, name, weight
- 🗂️ Category chips + subcategories (Tanishq-inspired taxonomy)
- 👥 Customer CRM with tier support (VVIP/VIP/Regular)
- 📊 Analytics with Chart.js: stock status, categories, customer tiers
- 🎨 Premium dark-navy & gold design system
- 📱 Fully responsive

## Tech Stack
- React 18 + Create React App
- Supabase (Auth + PostgreSQL)
- Cloudinary (image uploads)
- n8n (AI content generation webhook)
- Chart.js
- Lucide React icons
- CSS Modules

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Install & Run
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration
All config is in `src/lib/config.js`. Update these values if needed:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_KEY` — your Supabase publishable key
- `CLOUDINARY_CLOUD` — your Cloudinary cloud name
- `CLOUDINARY_PRESET` — your unsigned upload preset
- `N8N_BASE` — your n8n instance URL

## What's NOT yet implemented (needs additional info):

1. **Hero/landing section images** — Need Cloudinary image URLs or locally stored jewellery images for the login hero section
2. **n8n webhook schema** — The exact payload structure expected by your n8n workflows for product upload, delete, and approval
3. **Supabase schema details** — Exact column names for stores and products tables (guessed from existing HTML; verify against your schema)
4. **WhatsApp bot integration** — Bot feature toggling in UI (needs confirmation of feature flags in stores table)
5. **Virtual Try-On UI** — Feature exists in plan but no UI flow provided
6. **Conversation trend data** — Analytics line chart needs real data from `whatsapp_logs` table (currently shows placeholder zeros)
7. **Image storage from Cloudinary for existing products** — Verify `image_urls` column is an array type in Supabase
8. **Plan upgrade flow** — Currently shows an email alert; could be replaced with a real payment/Razorpay integration
9. **AI description display** — Cards show `ai_title` if available; confirm column names `ai_title` and `ai_description` match your schema
10. **Bulk actions** — Select multiple SKUs to mark in/out of stock (not implemented yet)

## Database Schema Assumptions
Based on the existing HTML, the app assumes:
- `stores` table: `id, owner_id, status, store_name, owner_name, plan_name, ...`
- `products` table: `id, owner_id, sku_code, item_name, category, sub_category, carat, diamond_purity, material, occasion, weight_grams, price, stock_qty, status, image_urls (array), ai_title, ai_description, description, is_current, created_at`
- `customers` table: `id, owner_id, name, tier, whatsapp_number, email, city, notes, created_at`

Please provide your actual schema to fix any column name mismatches.
