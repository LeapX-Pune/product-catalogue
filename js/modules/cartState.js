import { loadCart, saveCart, clearCartStorage } from "../utils/localStorage.js";
import { coupons } from "../constants/coupons.js";

/**
 * Cart state management module.
 * Uses an array stack to manage cart items with
 * .reduce() for totals/counts and a pub/sub
 * pattern for reactive re-rendering.
 */

let cart = loadCart();
const subscribers = new Set();

function notify() {
  saveCart(cart);
  subscribers.forEach((fn) => fn());
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getCart() {
  return [...cart];
}

export function addItem(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }
  notify();
}

export function removeItem(productId) {
  cart = cart.filter((item) => item.id !== productId);
  notify();
}

export function incrementItem(productId) {
  const item = cart.find((i) => i.id === productId);
  if (item) {
    item.quantity += 1;
    notify();
  }
}

export function decrementItem(productId) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.quantity -= 1;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  }
  notify();
}

export function clearCart() {
  cart = [];
  clearCartStorage();
  notify();
}

/**
 * Grand total using .reduce().
 * Optionally applies a coupon discount.
 */
export function getCartTotal(appliedCoupon = null) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  if (!appliedCoupon) return subtotal;
  if (appliedCoupon.type === "percentage") {
    return subtotal - subtotal * (appliedCoupon.discountValue / 100);
  }
  if (appliedCoupon.type === "fixed") {
    return Math.max(0, subtotal - appliedCoupon.discountValue);
  }
  return subtotal;
}

/**
 * Running total item count using .reduce().
 */
export function getCartItemCount() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Validate and return a coupon object from a code string,
 * or null if invalid.
 */
export function validateCoupon(code) {
  return coupons.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase(),
  ) || null;
}
