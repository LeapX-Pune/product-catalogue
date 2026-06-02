import {
  getCart,
  addItem,
  removeItem,
  incrementItem,
  decrementItem,
  clearCart,
  getCartTotal,
  getCartItemCount,
  validateCoupon,
  subscribe,
} from "./cartState.js";

/**
 * Shopping Cart component.
 * Manages the sidebar cart UI with:
 * - Item listings (image, title, subtotal, quantity +/-)
 * - Live grand total via .reduce()
 * - Discount code engine
 * - Clear Cart with confirmation
 * - Empty state messaging
 */

const EMPTY_TEXT = "Your cart is empty. Drag items here!";
let appliedCoupon = null;
let discountError = "";

function formatPrice(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function render() {
  const container = document.getElementById("shopping-cart");
  if (!container) return;

  const cart = getCart();
  const itemCount = getCartItemCount();
  const grandTotal = getCartTotal(appliedCoupon);

  const isEmpty = cart.length === 0;
  let hasDiscount = false;

  if (appliedCoupon) {
    const rawTotal = getCartTotal();
    hasDiscount = rawTotal !== grandTotal;
  }

  container.innerHTML = `
    <div class="cart-inner">
      <div class="cart-header">
        <h2>Shopping Cart</h2>
        ${!isEmpty ? `<span class="cart-item-count">${itemCount} item${itemCount !== 1 ? "s" : ""}</span>` : ""}
      </div>

      ${
        isEmpty
          ? `<div class="cart-empty">${EMPTY_TEXT}</div>`
          : `
        <ul class="cart-items">
          ${cart
            .map(
              (item) => `
            <li class="cart-item" data-id="${item.id}">
              <img class="cart-item-image" src="${item.image}" alt="${item.title}" loading="lazy" />
              <div class="cart-item-details">
                <p class="cart-item-title">${item.title}</p>
                <p class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</p>
                <div class="cart-item-qty">
                  <button class="qty-btn qty-decrement" data-id="${item.id}">−</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn qty-increment" data-id="${item.id}">+</button>
                  <button class="item-remove" data-id="${item.id}" title="Remove item">🗑</button>
                </div>
              </div>
            </li>
          `,
            )
            .join("")}
        </ul>

        <div class="cart-discount">
          <input type="text" id="discount-input" placeholder="Coupon code (e.g. SAVE10)" value="${appliedCoupon ? appliedCoupon.code : ""}" />
          <button id="discount-apply" ${appliedCoupon ? "disabled" : ""}>Apply</button>
          ${discountError ? `<p class="discount-error">${discountError}</p>` : ""}
          ${appliedCoupon ? `<p class="discount-applied">${appliedCoupon.description}</p>` : ""}
        </div>

        <div class="cart-totals">
          ${hasDiscount ? `<div class="cart-total-row"><span>Subtotal</span><span>${formatPrice(getCartTotal())}</span></div>` : ""}
          ${hasDiscount ? `<div class="cart-total-row discount"><span>Discount (${appliedCoupon.code})</span><span>−${formatPrice(getCartTotal() - grandTotal)}</span></div>` : ""}
          <div class="cart-total-row grand-total"><span>Total</span><span>${formatPrice(grandTotal)}</span></div>
        </div>

        <div class="cart-actions">
          <button class="btn btn-checkout">Checkout</button>
          <button class="btn btn-clear">Clear Cart</button>
        </div>
      `
      }
    </div>
  `;

  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll(".qty-increment").forEach((btn) => {
    btn.addEventListener("click", () => {
      incrementItem(Number(btn.dataset.id));
    });
  });

  document.querySelectorAll(".qty-decrement").forEach((btn) => {
    btn.addEventListener("click", () => {
      decrementItem(Number(btn.dataset.id));
    });
  });

  document.querySelectorAll(".item-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeItem(Number(btn.dataset.id));
    });
  });

  const applyBtn = document.getElementById("discount-apply");
  if (applyBtn) {
    applyBtn.addEventListener("click", handleApplyDiscount);
  }

  const discountInput = document.getElementById("discount-input");
  if (discountInput) {
    discountInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleApplyDiscount();
    });
  }

  const checkoutBtn = document.querySelector(".btn-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      alert("Checkout functionality coming soon!");
    });
  }

  const clearBtn = document.querySelector(".btn-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (window.confirm("Are you sure you want to clear your cart?")) {
        appliedCoupon = null;
        discountError = "";
        clearCart();
      }
    });
  }
}

function handleApplyDiscount() {
  const input = document.getElementById("discount-input");
  const code = input ? input.value.trim() : "";

  if (!code) {
    discountError = "Please enter a coupon code.";
    appliedCoupon = null;
    render();
    return;
  }

  const coupon = validateCoupon(code);
  if (coupon) {
    appliedCoupon = coupon;
    discountError = "";
  } else {
    appliedCoupon = null;
    discountError = `"${code}" is not a valid coupon code.`;
  }
  render();
}

export function initShoppingCart() {
  subscribe(render);
  render();
}
