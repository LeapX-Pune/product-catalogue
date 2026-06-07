/**
 * NOTE: This utility is NOT currently imported by index.html or script.js.
 * The active cart calculations are inlined in js/script.js.
 * If integrating this module, ensure the cart item shape uses `qty` (not `quantity`).
 */

/**
 * Utility functions for cart totals and calculations.
 * Supports checkout validation and cart badge counts.
 */

/**
 * Calculates the total cost of all items in the cart.
 * 
 * @param {Array} cart - List of cart items (Cart Item Shape).
 * @returns {number} The total sum of prices * quantities.
 */
export const calculateCartTotal = (cart, appliedCoupon = null) => {
  if (!Array.isArray(cart)) return 0;
  
  let total = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.qty) || 0;
    return sum + price * quantity;
  }, 0);

  if (appliedCoupon) {
    if (appliedCoupon.minOrderValue && total < appliedCoupon.minOrderValue) {
      // Coupon condition not met, do not apply discount
    } else {
      if (appliedCoupon.type === "percentage") {
        total = total - (total * (appliedCoupon.discountValue / 100));
      } else if (appliedCoupon.type === "fixed") {
        total = total - appliedCoupon.discountValue;
      }
    }
  }

  // Ensure total doesn't go below 0
  return Math.max(0, total);
};

/**
 * Calculates the total number of physical items in the cart.
 * 
 * @param {Array} cart - List of cart items (Cart Item Shape).
 * @returns {number} The sum of all item quantities.
 */
export const calculateCartItems = (cart) => {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((total, item) => {
    const quantity = Number(item.qty) || 0;
    return total + quantity;
  }, 0);
};
