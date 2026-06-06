import { products } from "../data/products.js";

let isDragging = false;
let returnTimer = null;
let _enabled = false;
let _observers = [];

const getCartBtn = () => document.querySelector(".cart-drawer-trigger");

function floatCartToDropZone() {
    const btn = getCartBtn();
    if (!btn) return;

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    btn.classList.add("drag-drop-zone");

    const header = document.querySelector("header");
    if (header) header.style.pointerEvents = "auto";

    const navbar = document.querySelector(".navbar-blur");
    if (navbar) navbar.classList.add("drag-active");
}

function returnCartToOrigin() {
    const btn = getCartBtn();
    if (!btn) return;

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    returnTimer = setTimeout(() => {
        btn.classList.remove("drag-drop-zone", "drag-drop-zone--over", "drag-drop-zone--success");
        isDragging = false;

        const header = document.querySelector("header");
        if (header) header.style.pointerEvents = "";

        const navbar = document.querySelector(".navbar-blur");
        if (navbar) navbar.classList.remove("drag-active");
    }, 160);
}

function onCartDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const btn = getCartBtn();
    if (btn) btn.classList.add("drag-drop-zone--over");
}

function onCartDragLeave(e) {
    const btn = getCartBtn();
    if (!btn) return;
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

    if (typeof window.__luxeAddToCart === "function") {
        window.__luxeAddToCart(product);
    }

    btn.classList.add("drag-drop-zone--success");
    returnCartToOrigin();
}

function onCardDragStart(e) {
    const card = e.currentTarget;
    const productId = card.dataset.productId;
    if (!productId) return;

    isDragging = true;
    e.dataTransfer.setData("text/plain", productId);
    e.dataTransfer.effectAllowed = "copy";

    card.classList.add("dragging-card");
    floatCartToDropZone();
}

function onCardDragEnd(e) {
    e.currentTarget.classList.remove("dragging-card");
    if (isDragging) {
        returnCartToOrigin();
    }
}

function bindDragToCards() {
    document.querySelectorAll(".product-card").forEach(card => {
        if (card.dataset.dragBound) return;
        card.dataset.dragBound = "1";
        card.setAttribute("draggable", "true");
        card.addEventListener("dragstart", onCardDragStart);
        card.addEventListener("dragend", onCardDragEnd);
    });
}

function bindDropZoneToCart() {
    const btn = getCartBtn();
    if (!btn || btn.dataset.dropBound) return;
    btn.dataset.dropBound = "1";
    btn.addEventListener("dragover", onCartDragOver);
    btn.addEventListener("dragleave", onCartDragLeave);
    btn.addEventListener("drop", onCartDrop);
}

export function enableDragDrop() {
    if (_enabled) return;
    _enabled = true;

    bindDragToCards();

    _observers.forEach(({ el, observer }) => {
        observer.observe(el, { childList: true });
    });
}

export function disableDragDrop() {
    if (!_enabled) return;
    _enabled = false;

    _observers.forEach(({ el, observer }) => {
        observer.disconnect();
    });

    document.querySelectorAll(".product-card").forEach(card => {
        card.removeAttribute("draggable");
    });

    document.querySelectorAll(".drag-drop-zone, .drag-drop-zone--over, .drag-drop-zone--success").forEach(el => {
        el.classList.remove("drag-drop-zone", "drag-drop-zone--over", "drag-drop-zone--success");
    });
    document.querySelectorAll(".dragging-card").forEach(el => el.classList.remove("dragging-card"));
    document.querySelectorAll(".drag-active").forEach(el => el.classList.remove("drag-active"));

    const header = document.querySelector("header");
    if (header) header.style.pointerEvents = "";

    isDragging = false;
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }
}

export function initDragDrop(addToCartFn) {
    window.__luxeAddToCart = addToCartFn;

    bindDropZoneToCart();

    const grids = ["product-grid-shop", "product-grid-interactive", "product-grid-animated"];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const observer = new MutationObserver(() => {
            if (_enabled) bindDragToCards();
        });
        _observers.push({ el, observer });
    });

    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e) => {
        if (e.matches) enableDragDrop();
        else disableDragDrop();
    };
    mq.addEventListener("change", handler);

    if (mq.matches) enableDragDrop();
}
