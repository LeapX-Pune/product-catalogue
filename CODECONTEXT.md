# Codebase Context: LuxeCart — Product Catalog with Cart and Checkout System

## Project Overview
A modern ecommerce frontend application called **LuxeCart** where users browse products, search, filter, manage a cart (click + drag-and-drop), and complete a multi-step checkout. Built with vanilla HTML/CSS/JS.

---

## Tech Stack
- **HTML5** — Single-page with 9 view containers
- **Tailwind CSS 3** (CDN with forms & container-queries plugins)
- **Custom CSS** (`css/styles.css`) — Dark theme, animations, custom components
- **Vanilla JavaScript ES Modules** (`js/script.js` as entry point)
- **Google Fonts**: Inter + Material Symbols Outlined
- No framework, no build step

---

## Directory Structure

```
product-catalogue/
├── index.html                    # Single-page app with all 9 views
├── README.md
├── CODECONTEXT.md                # ← This file
├── Project_ Product Catalog...   # PRD document
├── css/
│   └── styles.css                # Dark theme, animations, custom components
├── js/
│   ├── script.js                 # Main application logic (~1170 lines)
│   ├── data/
│   │   └── products.js           # 250 mock products across categories
│   ├── constants/
│   │   ├── coupons.js            # 8 coupon codes (percentage + fixed)
│   │   └── filterDefaults.js     # Default filter state values
│   ├── utils/
│   │   ├── calculations.js       # Cart total & item count helpers
│   │   └── localStorage.js       # LocalStorage persistence (load/save/clear)
│   └── modules/
│       └── initial_module.js     # Empty file
└── assets/
    ├── images/test.img
    └── videos/test.mp4
```

---

## Views (Client-Side Router)

| ID | View Name | Purpose |
|----|-----------|---------|
| `view-home` | Home | Hero banner, category cards grid, value props, About Us |
| `view-shop` | Shop | Product grid, collapsible sidebar filters, subcategory tabs, sort, empty state |
| `view-interactive-shop` | Interactive Studio | Drag-and-drop focused product grid with checkbox filters |
| `view-animated-shop` | Animated Catalog | Product grid with entry animations, checkbox filters |
| `view-checkout-shipping` | Checkout — Shipping | Shipping address form (3-step progress bar) |
| `view-checkout-payment` | Checkout — Payment | Card payment form |
| `view-checkout-review` | Checkout — Review | Order summary, coupon application, place order |
| `view-order-confirmed` | Order Confirmed | Success message with track/store buttons |
| `view-order-tracker` | Order Tracker | Stepper progress, shipment items, billing details |

---

## Core State (`script.js:6-32`)

```js
const state = {
  cart: [],
  shippingAddress: { recipient, line1, cityStateZip, country, phone },
  paymentMethod: { type, cardNumber, expiry },
  appliedCoupon: null,
  currentOrderId: "LX-98241",
  activeView: "home",
  filters: {
    category: "All",
    priceRange: [],       // checkbox-based: ["0-5000","5000-15000","15000-plus"]
    priceMin: 0,          // slider-based
    priceMax: 30000,      // slider-based
    rating: 0,            // single-select: 4.5 or 4.8
    searchQuery: "",
    sortOrder: "newest"
  }
};
```

---

## Key Architecture Decisions

### Filtering Logic (`getFilteredProducts` at line 584)
- Category filtering (case-insensitive match)
- Text search against title + category
- **Two price filter modes**: slider-based (`priceMin`/`priceMax`) for shop view; checkbox-based (`priceRange` array) for interactive/animated views
- Rating filter (single-select — unchecking other boxes)
- Sorting applied in `renderGrids` (newest, low-to-high, high-to-low)

### Cart System
- Add via button click (`quick-add-btn`) → opens drawer
- Add via drag-and-drop (`dragstart`/`drop` events on product cards)
- Quantity inc/dec, remove individual items, clear all
- Cart count badges, subtotal display
- No `localStorage` persistence wired (utility exists but unused in `script.js`)

### Checkout Funnel
1. **Shipping form** → stores address into state → switches to payment
2. **Payment form** → stores masked card data → switches to review
3. **Review** → shows order summary, coupon input, place order
4. **Place order** → generates `LX-XXXXX` order ID, clears cart, shows confirmation
5. **Order tracker** → animated stepper, mock shipment items (hardcoded)

### Drag-and-Drop
- `dragstart` on `.product-card` sets `application/json` data
- `dragover` on `#cart-drop-zone` highlights area
- `drop` → `addToCart(item)` → success animation → open drawer
- Peek preview: drawer slides out 10% during drag

---

## Product Data Shape

```js
{
  id: number,
  title: string,
  name: string,
  category: string,    // "Electronics" | "Fashion" | "Home & Kitchen" | "Fitness" | "Home Decor" | "Accessories"
  subcategory: string,  // e.g. "Smartphones", "Laptops", "Audio", "Men's Wear"
  brand: string,
  description: string,
  image: string,        // Unsplash URL
  price: number,        // in paise (e.g. 18999 = ₹189.99)
  rating: number,       // 0.0 - 5.0
  stockStatus: string   // "In Stock" | "Low Stock"
}
```

**Note**: The category `"Fashion"` is used in products.js but the UI shows `"Apparel"`. The code maps `Apparel → Fashion` via a radio button value hack.

---

## Available Coupons (`constants/coupons.js`)

| Code | Type | Value |
|------|------|-------|
| WELCOME10 | percentage | 10% |
| SAVE200 | fixed | ₹200 |
| FASHION15 | percentage | 15% |
| ELECTRO10 | percentage | 10% |
| FESTIVE20 | percentage | 20% |
| FIRSTBUY | percentage | 20% |
| HOME250 | fixed | ₹250 |
| BEAUTY15 | percentage | 15% |

---

## PRD Gap Analysis

| FR ID | Requirement | Status | Notes |
|-------|-------------|--------|-------|
| FR-1 | Product catalog grid | ✅ Done | 3 grid views (shop/interactive/animated) |
| FR-2 | Text search | ✅ Done | Real-time filtering via input event |
| FR-3 | Category filter | ✅ Done | Sidebar radio, navbar dropdown, section buttons |
| FR-4 | Price range filter | ✅ Done | Dual slider + manual number inputs |
| FR-5 | Rating filter | ✅ Done | Checkboxes for 4.5+ and 4.8+ |
| FR-6 | Multiple filters together | ✅ Done | All filters compose in `getFilteredProducts` |
| FR-7 | Add to cart via button | ✅ Done | `quick-add-btn` on each card |
| FR-8 | Drag-and-drop to cart | ✅ Done | Full HTML5 DnD implementation |
| FR-9 | Cart count + total | ✅ Done | Badge on cart icon + drawer subtotal |
| FR-10 | Quantity inc/dec | ✅ Done | +/- buttons in cart drawer |
| FR-11 | Checkout form | ⚠️ Partial | Missing email & pincode fields specified in PRD |
| FR-12 | Validation errors | ⚠️ Partial | Only HTML5 `required`; no custom messages per PRD spec |
| FR-13 | Responsive layout | ✅ Done | Mobile sidebar collapse, responsive grids |
| FR-14 | LocalStorage persistence | ❌ Missing | Utility exists (`localStorage.js`) but not imported/wired |
| FR-15 | Animations/transitions | ✅ Done | View transitions, drag effects, cart bounce, success pop |

### Other Gaps
1. **Checkout form fields**: PRD specifies Full Name, Email, Phone, Shipping Address, City, Pincode → current form has no email field and combines City/State/ZIP into one field
2. **Empty cart checkout**: Current implementation uses `alert()` → PRD expects prevented submission with UI feedback
3. **Subcategory filtering**: Buttons exist visually but don't actually filter `getFilteredProducts`
4. **Category naming inconsistency**: Products use `"Fashion"` category but UI shows `"Apparel"`; mapping is fragile
5. **Footer `category-card` class**: Footer category list items have `category-card` class, triggering the same click handler as homepage category cards (potential navigation bug)

---

## Unused/Orphaned Files
- `js/utils/localStorage.js` — full load/save/clear implementation, never imported
- `js/utils/calculations.js` — `calculateCartTotal` and `calculateCartItems` functions, never imported (logic duplicated inline in `script.js`)
- `js/constants/filterDefaults.js` — imported from `products.js` but not used in `script.js`
- `js/modules/initial_module.js` — empty file
- `assets/images/test.img`, `assets/videos/test.mp4` — placeholder files

---

## Key CSS Architecture
- **Dark theme**: CSS custom properties in `:root` for the full palette
- **Radial gradient backgrounds** on `body` with teal/coral accents
- **`.navbar-blur`**: Glass-morphism nav bar with backdrop blur
- **`.product-card`**: Card with hover lift, image scale, quick-add button
- **`.drag-over`**: Visual feedback on cart drop zone during drag
- **`.btn-primary` / `.btn-ghost` / `.btn-accent`**: Reusable button variants
- **`.input-dark`**: Dark form inputs with teal focus ring
- **`.slider-thumb-style`**: Custom dual range slider thumbs
- **Responsive**: Mobile-first with `md:` breakpoints, sidebar collapses
