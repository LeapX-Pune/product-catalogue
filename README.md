# Product Catalogue State Management & Data Layer

This repository contains the core global state management and data layer architecture for the LeapX Product Catalogue project. It is designed to act as a lightweight, robust, and highly predictable single source of truth (SSOT) serving all interactive UI elements in the application.

---

## 🛠️ Tech Stack & Architecture Rationale

The data layer is built strictly using **React**, the **Context API**, **`useReducer`**, **JavaScript (ES Modules)**, and browser **`localStorage`**. 

Here is the architectural rationale behind this stack selection:

### 1. React & Context API (No Prop-Drilling)
React's virtual DOM and declarative rendering allow the UI to react instantly to state modifications. To make this state globally accessible without heavy third-party state libraries (like Redux or Recoil), we use the native **Context API**. This completely eliminates "prop drilling" (passing down handlers and values through intermediate UI wrappers) and provides a clean, unified hook interface (`useAppContext()`) for all UI students.

### 2. Predictable State Transitions with `useReducer`
As a product catalog grows, state updates (adding items, adjusting quantities, merging multiple filters, resetting searches, switching pages) become complex. By choosing `useReducer` over scattered `useState` hooks, we centralize all state mutations into a single **pure reducer function** (`AppReducer.js`). This ensures:
- **Predictability**: Every transition is triggered by a typed Action, leaving a clean, auditable trail.
- **Maintainability**: Core business logic is separated from visual React component code.

### 3. Native Browser `localStorage` for Persistence
To fulfill **FR-14** (Cart Persistence), we leverage browser `localStorage`.
- The initial state automatically attempts to load and parse any previously saved cart.
- A central `useEffect` inside the `AppProvider` automatically stringifies and writes the cart to `localStorage` whenever it changes, preventing synchronization lag.
- Utility handlers include safety bounds (SSR safety guards) to ensure that code never throws ReferenceErrors in server-side rendering or isolated Node.js test environments where `window` or `localStorage` might be undefined.

---

## 📂 Folder & File Structure

All data layer files reside in the `src/` directory, following a clean and modular folder organization:

```txt
src/
├── constants/
│   └── filterDefaults.js   # Single source of truth for filter reset values
├── data/
│   └── products.js         # Local database of mock products (12 premium items)
├── utils/
│   ├── localStorage.js     # Persistent storage handlers with SSR safety guards
│   └── calculations.js     # Pure utility functions to compute totals & item counts
├── context/
│   ├── AppContext.jsx      # Global React Context creation
│   ├── AppReducer.js       # Core engine managing all state transitions (Reducer)
│   ├── initialState.js     # Schema for the complete initial application state
│   └── actionTypes.js      # String constants preventing typo errors in dispatches
├── providers/
│   └── AppProvider.jsx     # High-Order Component wrapping the app with state & handlers
└── hooks/
    └── useAppContext.js    # Custom Hook for simple, safe context consumption
```

### File-by-File Responsibilities

#### 1. `src/constants/filterDefaults.js`
Stores default filter parameters. Used to initialize state filters and to perform instantaneous, clean filter resets.
- Default object: `{ category: "", maxPrice: 10000, rating: 0 }`.

#### 2. `src/data/products.js`
Acts as our local mock database. Contains 12 mock product objects from diverse categories (Electronics, Apparel, Accessories, Fitness, Home Decor, Kitchen) with accurate price ranges, high-res Unsplash image URLs, and user ratings.

#### 3. `src/utils/localStorage.js`
Contains browser storage operations (`loadCart()`, `saveCart()`, `clearCartStorage()`). Features environment checks to prevent crashes when compiled under Node or SSR.

#### 4. `src/utils/calculations.js`
Houses pure arithmetic functions for the cart. 
- `calculateCartTotal(cart)`: Sums up `item.price * item.quantity` for all items.
- `calculateCartItems(cart)`: Sums up physical item counts (`item.quantity`).

#### 5. `src/context/actionTypes.js`
Declares capitalized string constants (`ADD_TO_CART`, `REMOVE_FROM_CART`, `SET_FILTERS`, etc.) to prevent typo mistakes and allow auto-complete inside IDEs.

#### 6. `src/context/initialState.js`
Constructs the complete application state schema:
```javascript
{
  products: Array,         // Loaded from products.js
  cart: Array,             // Restored from loadCart()
  searchQuery: String,     // For real-time search (FR-2)
  filters: Object,         // Multi-filters (category, maxPrice, rating)
  activeView: String       // Switch view conditional rendering ("catalog" | "checkout")
}
```

#### 7. `src/context/AppContext.jsx`
Instantiates the React Context object via `createContext()`.

#### 8. `src/context/AppReducer.js`
Implements the core reducer logic that responds to dispatch actions:
- **`ADD_TO_CART`**: Checks if the item is already present. If yes, increments its quantity. If no, copies the product details and appends it to the cart with a starting quantity of `1`.
- **`REMOVE_FROM_CART`**: Filters out the product from the cart array by ID.
- **`UPDATE_QUANTITY`**: Modifies the quantity. If quantity drops to `0`, it is automatically filtered out (removed) from the cart.
- **`CLEAR_CART`**: Empties the cart.
- **`SET_SEARCH_QUERY`**: Updates the search query string.
- **`SET_FILTERS`**: Merges new filter properties into the existing filter object to enable multi-filtering concurrently.
- **`TOGGLE_VIEW`**: Switches between `"catalog"` and `"checkout"` (with safety fallbacks to `"catalog"` if an invalid string is passed).

#### 9. `src/providers/AppProvider.jsx`
The central state hub that utilizes `useReducer(AppReducer, initialState)` and binds the reducer dispatches into clean, reusable handlers. It passes the current state, derived metrics (`cartTotal`, `cartItemsCount`), and handlers down to the app's React tree.

#### 10. `src/hooks/useAppContext.js`
A developer-friendly custom hook that wraps `useContext(AppContext)`. It verifies that it is consumed inside an `AppProvider` wrapper, throwing explicit error messages if called outside the context boundaries.

---

## 🤝 Integration Contracts (API for Teammates)

Teammates working on UI designs, catalog cards, shopping carts, filters, or checkout forms can easily consume the global state and state-altering handlers.

### How to consume context in a component:

```javascript
import { useAppContext } from '../hooks/useAppContext.js';

function MyComponent() {
  const {
    // 1. Raw State Trees
    state,             // { products, cart, searchQuery, filters, activeView }
    
    // 2. Computed Derivatives (Derived States)
    cartTotal,         // Sum of (price * quantity) of all cart items (number)
    cartItemsCount,    // Total quantity of items in the cart (number)
    
    // 3. Shared Reusable Handlers
    addToCart,         // function: addToCart(id)
    removeFromCart,    // function: removeFromCart(id)
    updateQuantity,    // function: updateQuantity(id, type) --> type is "increment" | "decrement"
    clearCart,         // function: clearCart()
    setSearchQuery,    // function: setSearchQuery(value) --> updates real-time search term
    setFilters,        // function: setFilters(data) --> e.g., { category: "Electronics" }
    toggleView         // function: toggleView(view) --> view is "catalog" | "checkout"
  } = useAppContext();

  // ... your component render logic ...
}
```

### Essential Shapes

#### Product Shape (in `state.products`):
```javascript
{
  id: Number,
  title: String,
  category: String,
  price: Number,
  rating: Number,
  image: String
}
```

#### Cart Item Shape (in `state.cart`):
```javascript
{
  id: Number,
  title: String,
  price: Number,
  quantity: Number,
  image: String
}
```

---

## 🧪 Testing & Verification

The state management and calculations are fully unit tested and verified in isolation under standard environments. 

To run the verification suite:
1. Open a terminal.
2. Execute the test command:
   ```bash
   node .system_generated/logs/../../antigravity-ide/brain/a456959d-4449-48d0-8cca-e2a873efe76c/scratch/testStateManagement.js
   ```
This runs 8 extensive test cases verifying mock integrity, cart arithmetic, localStorage syncing, reducer case switches, filter merges, and fallback views.