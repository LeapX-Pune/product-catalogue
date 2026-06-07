import { products } from "../data/products.js";

let isDragging = false;
let _enabled = false;
let _observers = [];
let _dropZoneEl = null;
let _positionRaf = null;
let _dropHandled = false;
let returnTimer = null;
let _trayProximityHandler = null;

const getCartBtn = () => document.querySelector(".cart-drawer-trigger");

function handleDrop(e) {
    e.preventDefault();
    const productId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(productId)) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (typeof window.__luxeAddToCart === "function") {
        window.__luxeAddToCart(product);
    }

    const btn = getCartBtn();
    if (btn) btn.classList.add("drag-drop-zone--success");

    if (_dropZoneEl) {
        _dropZoneEl.classList.add("dropping");
        _dropZoneEl.classList.remove("active");
    }

    returnCartToOrigin(true);
}

function createDropZone() {
    if (_dropZoneEl) return;

    const el = document.createElement("div");
    el.className = "drop-zone-tray";
    el.id = "drop-zone-tray";
    el.innerHTML = `
        <div class="drop-zone-inner">
            <div class="drop-zone-icon-wrapper">
                <span class="material-symbols-outlined">add</span>
            </div>
            <div class="drop-zone-text">
                Drop item here
                <small>Add to cart</small>
            </div>
        </div>
    `;

    el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        el.classList.add("active");
        const btn = getCartBtn();
        if (btn) btn.classList.add("drag-drop-zone--over");
    });

    el.addEventListener("dragleave", (e) => {
        if (!el.contains(e.relatedTarget)) {
            if (!isDragging) el.classList.remove("active");
            const btn = getCartBtn();
            if (btn) btn.classList.remove("drag-drop-zone--over");
        }
    });

    el.addEventListener("drop", handleDrop);

    document.body.appendChild(el);
    _dropZoneEl = el;
}

function removeDropZone() {
    if (_positionRaf) {
        cancelAnimationFrame(_positionRaf);
        _positionRaf = null;
    }
    if (_dropZoneEl && _dropZoneEl.parentElement) {
        _dropZoneEl.parentElement.removeChild(_dropZoneEl);
    }
    _dropZoneEl = null;
}

function positionDropZone() {
    if (!_dropZoneEl) return;
    const btn = getCartBtn();
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const zoneWidth = 260;
    const margin = 16;
    const halfWidth = zoneWidth / 2;
    let left = rect.left + rect.width / 2;
    left = Math.max(halfWidth + margin, Math.min(window.innerWidth - halfWidth - margin, left));
    _dropZoneEl.style.left = `${left}px`;
    _dropZoneEl.style.top = `${rect.bottom + 10}px`;
}

function _showDropZone() {
    createDropZone();
    if (_dropZoneEl) {
        _dropZoneEl.classList.remove("dropping");
        _dropZoneEl.classList.add("active");
        positionDropZone();
    }

    const header = document.querySelector("header");
    if (header) header.style.pointerEvents = "auto";
}

function returnCartToOrigin(isDrop = false) {
    const btn = getCartBtn();
    if (!btn) return;

    _dropHandled = true;

    const delay = isDrop ? 650 : 160;

    returnTimer = setTimeout(() => {
        _teardownTrayProximity();
        btn.classList.remove("drag-drop-zone", "drag-drop-zone--over", "drag-drop-zone--success");
        isDragging = false;

        if (_dropZoneEl) {
            _dropZoneEl.classList.remove("active", "dropping");
        }

        const header = document.querySelector("header");
        if (header) header.style.pointerEvents = "";

        const navbar = document.querySelector(".navbar-blur");
        if (navbar) navbar.classList.remove("drag-active");

        _dropHandled = false;
        returnTimer = null;
    }, delay);
}

/* ---- Tray Proximity Scaling ---- */

function _setupTrayProximity() {
    _teardownTrayProximity();
    _trayProximityHandler = (e) => {
        if (!_dropZoneEl || !_dropZoneEl.isConnected) return;
        if (!_dropZoneEl.classList.contains("active")) return;

        const rect = _dropZoneEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const maxDist = 300;
        const t = Math.min(dist, maxDist) / maxDist;
        const scale = 1 + 0.2 * (1 - t * t);

        _dropZoneEl.style.transform = `translateX(-50%) scale(${scale})`;
    };
    document.addEventListener("dragover", _trayProximityHandler);
}

function _teardownTrayProximity() {
    if (_trayProximityHandler) {
        document.removeEventListener("dragover", _trayProximityHandler);
        _trayProximityHandler = null;
    }
    if (_dropZoneEl) {
        _dropZoneEl.style.transform = "";
    }
}

/* ---- Drop Zone Handlers (navbar cart button fallback) ---- */

function onCartDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    const btn = getCartBtn();
    if (btn) btn.classList.add("drag-drop-zone--over");

    if (_dropZoneEl) {
        _dropZoneEl.classList.add("active");
        if (_positionRaf) cancelAnimationFrame(_positionRaf);
        _positionRaf = requestAnimationFrame(positionDropZone);
    }
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
    if (btn) btn.classList.remove("drag-drop-zone--over");
    handleDrop(e);
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

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    card.classList.add("dragging-card");
    _showDropZone();
    _setupTrayProximity();
}

function onCardDragEnd(e) {
    e.currentTarget.classList.remove("dragging-card");

    if (_dropHandled) return;

    _teardownTrayProximity();

    if (_dropZoneEl) {
        _dropZoneEl.classList.remove("active", "dropping");
    }

    const btn = getCartBtn();
    if (btn) {
        btn.classList.remove("drag-drop-zone", "drag-drop-zone--over", "drag-drop-zone--success");
    }

    const header = document.querySelector("header");
    if (header) header.style.pointerEvents = "";

    const navbar = document.querySelector(".navbar-blur");
    if (navbar) navbar.classList.remove("drag-active");

    isDragging = false;
    _dropHandled = false;
}

function bindDragToCards() {
    document.querySelectorAll(".product-card").forEach((card) => {
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
        observer.observe(el, { childList: true, subtree: true });
    });
}

export function disableDragDrop() {
    if (!_enabled) return;
    _enabled = false;

    _observers.forEach(({ el, observer }) => {
        observer.disconnect();
    });

    document.querySelectorAll(".product-card").forEach((card) => {
        card.removeAttribute("draggable");
        delete card.dataset.dragBound;
    });

    document
        .querySelectorAll(
            ".drag-drop-zone, .drag-drop-zone--over, .drag-drop-zone--success"
        )
        .forEach((el) => {
            el.classList.remove(
                "drag-drop-zone",
                "drag-drop-zone--over",
                "drag-drop-zone--success"
            );
        });
    document
        .querySelectorAll(".dragging-card")
        .forEach((el) => el.classList.remove("dragging-card"));
    document
        .querySelectorAll(".drag-active")
        .forEach((el) => el.classList.remove("drag-active"));

    removeDropZone();

    const header = document.querySelector("header");
    if (header) header.style.pointerEvents = "";

    _teardownTrayProximity();

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    isDragging = false;
    _dropHandled = false;
}

export function initDragDrop(addToCartFn) {
    window.__luxeAddToCart = addToCartFn;

    bindDropZoneToCart();

    const grids = [
        "product-grid-shop",
        "product-grid-interactive",
        "product-grid-animated",
    ];
    grids.forEach((id) => {
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
