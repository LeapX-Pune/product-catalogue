import { AppReducer } from "../context/AppReducer.js";
import { initialState } from "../context/initialState.js";
import { saveCart } from "../utils/localStorage.js";
import { calculateCartTotal, calculateCartItems } from "../utils/calculations.js";
import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_QUANTITY,
  CLEAR_CART,
  SET_SEARCH_QUERY,
  SET_FILTERS,
  TOGGLE_VIEW,
  APPLY_COUPON,
  REMOVE_COUPON
} from "../context/actionTypes.js";

/**
 * Core Vanilla JS Store using the Pub/Sub pattern.
 * Manages the global state and listeners without React.
 */
class Store {
  constructor(reducer, initial) {
    this.reducer = reducer;
    this.state = initial;
    this.listeners = [];
  }

  /**
   * Retrieves the current state.
   */
  getState = () => {
    return this.state;
  };

  /**
   * Dispatches an action to mutate the state and notifies all subscribers.
   */
  dispatch = (action) => {
    const prevState = JSON.parse(JSON.stringify(this.state));
    this.state = this.reducer(this.state, action);
    
    // Automatically save cart whenever state changes
    saveCart(this.state.cart);

    // --- Action Logs Monitor Engine ---
    console.groupCollapsed(
      `%c[STORE ACTION] %c${action.type}`,
      "color: #4f46e5; font-weight: bold; font-size: 11px;",
      "color: #0f172a; font-weight: 600; font-size: 11px;"
    );
    console.log("%cPayload:", "color: #3b82f6; font-weight: bold;", action.payload);
    console.log("%cPrev State:", "color: #64748b; font-weight: bold;", prevState);
    console.log("%cNext State:", "color: #10b981; font-weight: bold;", this.state);
    console.groupEnd();

    // Notify all listeners
    this.listeners.forEach((listener) => listener());
  };

  /**
   * Subscribes a listener to state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribe = (listener) => {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  // --- Reusable Shared Handlers ---

  addToCart = (id) => this.dispatch({ type: ADD_TO_CART, payload: id });
  removeFromCart = (id) => this.dispatch({ type: REMOVE_FROM_CART, payload: id });
  updateQuantity = (id, type) => this.dispatch({ type: UPDATE_QUANTITY, payload: { id, type } });
  
  clearCart = () => {
    this.dispatch({ type: CLEAR_CART });
  };

  setSearchQuery = (value) => this.dispatch({ type: SET_SEARCH_QUERY, payload: value });
  setFilters = (data) => this.dispatch({ type: SET_FILTERS, payload: data });
  toggleView = (view) => this.dispatch({ type: TOGGLE_VIEW, payload: view });
  applyCoupon = (coupon) => this.dispatch({ type: APPLY_COUPON, payload: coupon });
  removeCoupon = () => this.dispatch({ type: REMOVE_COUPON });

  // --- Derived State Selectors ---

  getCartTotal = () => calculateCartTotal(this.state.cart, this.state.appliedCoupon);
  getCartItemsCount = () => calculateCartItems(this.state.cart);

  getFilteredProducts = () => {
    const { products, filters, searchQuery } = this.state;
    return products.filter((product) => {
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.category && filters.category !== "All" && product.category !== filters.category) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }
      // Exact rating filter match (e.g. selecting 3 shows only 3.x products)
      if (filters.rating && filters.rating !== 0 && Math.floor(product.rating) !== filters.rating) {
        return false;
      }
      return true;
    });
  };
}

// Export a singleton instance of the store
export const store = new Store(AppReducer, initialState);
