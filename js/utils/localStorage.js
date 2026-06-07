/**
 * Utility functions for browser persistence of the cart.
 * Supports FR-14 (Persist cart using Local Storage).
 */

const STORAGE_KEY = "product_catalogue_cart";

/**
 * Loads the cart array from localStorage.
 * @returns {Array} The loaded cart items or an empty array.
 */
export const loadCart = () => {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return [];
    }
    const serializedCart = localStorage.getItem(STORAGE_KEY);
    if (serializedCart === null) {
      return [];
    }
    return JSON.parse(serializedCart);
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
    return [];
  }
};

/**
 * Saves the cart array to localStorage.
 * @param {Array} cart - The current cart state array.
 */
export const saveCart = (cart) => {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    const serializedCart = JSON.stringify(cart);
    localStorage.setItem(STORAGE_KEY, serializedCart);
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
};

/**
 * Clears the cart data from localStorage.
 */
export const clearCartStorage = () => {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear cart from localStorage:", error);
  }
};
