/**
 * dragdrop.js
 * Adds HTML5 Drag-and-Drop support to product cards.
 * Integrates with the existing cart via addToCart() and animateCartIcons().
 * Does NOT modify any existing cart state, UI, or logic.
 */

import { products } from "../data/products.js";

// ─── Internal state ───────────────────────────────────────────────────────────
let isDragging = false;
let returnTimer = null;

// The cart trigger button (the shopping_cart icon in the navbar)
const getCartBtn = () => document.querySelector(".cart-drawer-trigger");

// ─── Cart float: move the cart button to the lower-third drop zone ────────────
function floatCartToDropZone() {
    const btn = getCartBtn();
    if (!btn) return;

    // Cancel any pending return animation
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    btn.classList.add("drag-drop-zone");
}

function returnCartToOrigin() {
    const btn = getCartBtn();
    if (!btn) return;

    // Cancel any previous pending return
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    // 160ms — just enough for the success pulse to be visible, then snap back
    returnTimer = setTimeout(() => {
        btn.classList.remove("drag-drop-zone", "drag-drop-zone--over", "drag-drop-zone--success");
        isDragging = false;
    }, 160);
}

// ─── Drop zone hover handlers ─────────────────────────────────────────────────
function onCartDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const btn = getCartBtn();
    if (btn) btn.classList.add("drag-drop-zone--over");
}

function onCartDragLeave(e) {
    const btn = getCartBtn();
    if (!btn) return;
    // Only remove if the pointer truly left the button (not a child re-entry)
    if (!btn.contains(e.relatedTarget)) {
        btn.classList.remove("drag-drop-zone--over");
    }
}

function onCartDrop(e) {
    e.preventDefault();
    const btn = getCartBtn();
    if (!btn) return;

    btn.classList.remove("drag-drop-zone--over");

    const productId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(productId)) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // ── Call addToCart IMMEDIATELY — no delay, cart count updates right away ──
    if (typeof window.__luxeAddToCart === "function") {
        window.__luxeAddToCart(product);
    }

    // Success flash then return — short enough to feel instant
    btn.classList.add("drag-drop-zone--success");
    returnCartToOrigin();
}

// ─── Product card drag handlers ───────────────────────────────────────────────
function onCardDragStart(e) {
    const card = e.currentTarget;
    const productId = card.dataset.productId;
    if (!productId) return;

    isDragging = true;
    e.dataTransfer.setData("text/plain", productId);
    e.dataTransfer.effectAllowed = "copy";

    // Visual feedback on the card being dragged
    card.classList.add("dragging-card");

    // Move cart to the lower-third drop zone
    floatCartToDropZone();
}

function onCardDragEnd(e) {
    e.currentTarget.classList.remove("dragging-card");
    // If not dropped on cart, still return
    if (isDragging) {
        returnCartToOrigin();
    }
}

// ─── Attach drag events to all currently rendered product cards ───────────────
function bindDragToCards() {
    document.querySelectorAll(".product-card").forEach(card => {
        // Avoid double-binding
        if (card.dataset.dragBound) return;
        card.dataset.dragBound = "1";
        card.setAttribute("draggable", "true");
        card.addEventListener("dragstart", onCardDragStart);
        card.addEventListener("dragend", onCardDragEnd);
    });
}

// ─── Attach drop zone events to the cart button ───────────────────────────────
function bindDropZoneToCart() {
    const btn = getCartBtn();
    if (!btn || btn.dataset.dropBound) return;
    btn.dataset.dropBound = "1";
    btn.addEventListener("dragover", onCartDragOver);
    btn.addEventListener("dragleave", onCartDragLeave);
    btn.addEventListener("drop", onCartDrop);
}

// ─── Public init ──────────────────────────────────────────────────────────────
export function initDragDrop(addToCartFn) {
    // Expose the existing addToCart so the drop handler can call it
    window.__luxeAddToCart = addToCartFn;

    bindDropZoneToCart();
    bindDragToCards();

    // Re-bind cards whenever the grids are re-rendered (MutationObserver)
    const grids = ["product-grid-shop", "product-grid-interactive", "product-grid-animated"];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const observer = new MutationObserver(() => {
            bindDragToCards();
        });
        observer.observe(el, { childList: true });
    });
}
