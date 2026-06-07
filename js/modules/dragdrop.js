import { products } from "../data/products.js";

let isDragging = false;
let _enabled = false;
let _observers = [];
let _floatingCart = null;
let _dropHandled = false;
let _proximityHandler = null;

const getCartBtn = () => document.querySelector(".cart-drawer-trigger");

/* ---- Floating Cart Proxy ---- */

function _createFloatingCart(clientX) {
    _destroyFloatingCart(true);

    const btn = getCartBtn();
    if (!btn) return;

    const btnRect = btn.getBoundingClientRect();
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isLeft = clientX < vw / 2;
    const targetX = isLeft ? vw * 0.72 : vw * 0.28;
    const targetY = vh * 0.4;

    const proxy = document.createElement("div");
    proxy.className = "floating-cart-proxy";
    proxy.innerHTML = `<span class="material-symbols-outlined">shopping_cart</span>`;

    proxy.addEventListener("dragover", _onFloatingDragOver);
    proxy.addEventListener("dragleave", _onFloatingDragLeave);
    proxy.addEventListener("drop", _onFloatingDrop);

    // Place at navbar cart origin — no transition yet
    proxy.style.left = `${startX}px`;
    proxy.style.top = `${startY}px`;
    proxy.style.transition = "none";

    document.body.appendChild(proxy);
    _floatingCart = proxy;

    // Force layout so the initial position is committed
    proxy.offsetHeight;

    // Launch to target position and scale up
    proxy.style.transition =
        "left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), " +
        "top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), " +
        "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    proxy.style.left = `${targetX}px`;
    proxy.style.top = `${targetY}px`;
    proxy.classList.add("floating-cart-proxy--active");

    // Lock proxy static after launch animation finishes
    // Keep a transform transition for smooth proximity scaling
    let locked = false;
    const onLaunchEnd = () => {
        if (locked) return;
        locked = true;
        proxy.style.transition = "transform 0.15s ease";
        proxy.removeEventListener("transitionend", onLaunchEnd);
    };
    proxy.addEventListener("transitionend", onLaunchEnd);

    _startProximityTracking();
}

function _destroyFloatingCart(immediate = false) {
    if (!_floatingCart) return;

    _stopProximityTracking();

    const el = _floatingCart;
    el.classList.remove(
        "floating-cart-proxy--over",
        "floating-cart-proxy--active",
        "floating-cart-proxy--success",
        "floating-cart-proxy--near"
    );
    _floatingCart = null;

    const cleanup = () => {
        el.removeEventListener("dragover", _onFloatingDragOver);
        el.removeEventListener("dragleave", _onFloatingDragLeave);
        el.removeEventListener("drop", _onFloatingDrop);
        el.remove();
    };

    if (immediate) {
        cleanup();
        return;
    }

    // Animate out: shrink and fade
    el.classList.add("floating-cart-proxy--destroying");
    let ended = false;
    const onDestroyEnd = () => {
        if (ended) return;
        ended = true;
        el.removeEventListener("transitionend", onDestroyEnd);
        cleanup();
    };
    el.addEventListener("transitionend", onDestroyEnd);
}

function _onFloatingDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (_floatingCart) _floatingCart.classList.add("floating-cart-proxy--over");
}

function _onFloatingDragLeave(e) {
    if (_floatingCart && !_floatingCart.contains(e.relatedTarget)) {
        _floatingCart.classList.remove("floating-cart-proxy--over");
    }
}

function _onFloatingDrop(e) {
    e.preventDefault();
    if (_floatingCart) {
        _floatingCart.classList.remove("floating-cart-proxy--over");
    }

    const productId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(productId)) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (typeof window.__luxeAddToCart === "function") {
        window.__luxeAddToCart(product);
    }

    _dropHandled = true;
    if (_floatingCart) {
        _floatingCart.classList.add("floating-cart-proxy--success");
    }

    setTimeout(() => {
        _destroyFloatingCart(true);
        isDragging = false;
    }, 400);
}

/* ---- Proximity Detection ---- */

const PROXIMITY_THRESHOLD = 250;

function _checkProximity(clientX, clientY) {
    if (!_floatingCart) return;
    const cx = parseFloat(_floatingCart.style.left);
    const cy = parseFloat(_floatingCart.style.top);
    if (isNaN(cx) || isNaN(cy)) return;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    _floatingCart.classList.toggle("floating-cart-proxy--near", dist < PROXIMITY_THRESHOLD);
}

function _startProximityTracking() {
    _stopProximityTracking();
    _proximityHandler = (e) => {
        if (_floatingCart) _checkProximity(e.clientX, e.clientY);
    };
    document.addEventListener("dragover", _proximityHandler);
}

function _stopProximityTracking() {
    if (_proximityHandler) {
        document.removeEventListener("dragover", _proximityHandler);
        _proximityHandler = null;
    }
    if (_floatingCart) _floatingCart.classList.remove("floating-cart-proxy--near");
}

/* ---- Drop Zone Handlers (navbar cart button fallback) ---- */

function onCartDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function onCartDragLeave(e) {
    /* no visual state to manage */
}

function onCartDrop(e) {
    e.preventDefault();
    const productId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(productId)) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (typeof window.__luxeAddToCart === "function") {
        window.__luxeAddToCart(product);
    }
    _dropHandled = true;
    _destroyFloatingCart();
    isDragging = false;
}

/* ---- Card Drag Handlers ---- */

function onCardDragStart(e) {
    const card = e.currentTarget;
    const productId = card.dataset.productId;
    if (!productId) return;

    isDragging = true;
    _dropHandled = false;
    e.dataTransfer.setData("text/plain", productId);
    e.dataTransfer.effectAllowed = "copy";

    card.classList.add("dragging-card");
    _createFloatingCart(e.clientX);
}

function onCardDragEnd(e) {
    e.currentTarget.classList.remove("dragging-card");
    if (!_dropHandled) {
        _destroyFloatingCart();
        isDragging = false;
    }
    _dropHandled = false;
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
        delete card.dataset.dragBound;
    });

    document.querySelectorAll(".dragging-card").forEach(el => el.classList.remove("dragging-card"));

    _stopProximityTracking();
    _destroyFloatingCart(true);
    isDragging = false;
    _dropHandled = false;
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
