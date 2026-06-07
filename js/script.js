import { products } from "./data/products.js";
import { coupons } from "./constants/coupons.js";
import {
    validateFullName,
    validateEmail,
    validatePhone,
    validateStreet,
    validateCity,
    validatePincode,
} from "./utils/checkout_validator.js";
import { loadCart, saveCart, clearCartStorage } from "./utils/localStorage.js";
import { initDragDrop } from "./modules/dragdrop.js";
import {
    initSearchAndFilters,
    getFilteredProducts as getFilteredProductsSF,
    renderGridMarkup as renderGridMarkupSF,
    bindProductCardEvents as bindProductCardEventsSF
} from "./modules/search_filter.js";

// Global App State
const MAX_PRICE = 70000;

const state = {
    cart: [],
    shippingAddress: {
        recipient: "Alexander Remington",
        line1: "1248 Luxury Lane, Suite 200",
        cityStateZip: "Beverly Hills, CA 90210",
        country: "United States",
        phone: "+1 (555) 012-3456",
        email: ""
    },
    paymentMethod: {
        type: "Visa",
        cardNumber: "•••• 8842",
        expiry: "12/26"
    },
    appliedCoupon: null,
    currentOrderId: "LX-98241",
    activeView: "home",
    filters: {
        category: "All",
        priceRange: [], // Can contain "0-5000", "5000-15000", "15000-plus"
        priceMin: 0,
        priceMax: MAX_PRICE,
        rating: 0,
        searchQuery: "",
        sortOrder: "newest",
        subcategory: "All"
    }
};

// UI Elements
const DOM = {
    // Navigation / Views
    navLinks: document.querySelectorAll(".nav-link"),
    views: document.querySelectorAll(".view-container"),
    
    // Cart elements
    cartDrawer: document.getElementById("cart-drawer"),
    cartBackdrop: document.getElementById("drawer-backdrop"),
    cartItemsContainer: document.getElementById("cart-items"),
    cartCountBadges: document.querySelectorAll(".cart-count"),
    cartTotalDisplay: document.getElementById("cart-total"),
    checkoutDrawerBtn: document.getElementById("checkout-drawer-btn"),

    // Cart Page
    cartPageItems: document.getElementById("cart-page-items"),
    cartPageSubtotal: document.getElementById("cart-page-subtotal"),
    cartPageCount: document.getElementById("cart-page-count"),
    checkoutPageBtn: document.getElementById("checkout-page-btn"),

    // Product Grids
    gridShop: document.getElementById("product-grid-shop"),
    gridInteractive: document.getElementById("product-grid-interactive"),
    gridAnimated: document.getElementById("product-grid-animated"),
    emptyStateShop: document.getElementById("empty-state-shop"),
    emptyStateInteractive: document.getElementById("empty-state-interactive"),
    emptyStateAnimated: document.getElementById("empty-state-animated"),

    // Search & Sidebar filters
    searchInputs: document.querySelectorAll(".search-input"),
    categoryBtns: document.querySelectorAll(".category-btn"),
    applyFiltersBtns: document.querySelectorAll(".apply-filters"),
    resetFiltersBtns: document.querySelectorAll(".reset-filters"),

    // Checkout forms
    shippingForm: document.getElementById("shipping-form"),
    paymentForm: document.getElementById("payment-form"),
    couponInput: document.getElementById("coupon-input"),
    applyCouponBtn: document.getElementById("apply-coupon-btn"),
    couponMessage: document.getElementById("coupon-message"),

    // Order Review & Confirmed
    reviewItemsContainer: document.getElementById("review-items"),
    reviewRecipient: document.getElementById("review-recipient"),
    reviewAddress: document.getElementById("review-address"),
    reviewCardName: document.getElementById("review-card-name"),
    reviewCardExpiry: document.getElementById("review-card-expiry"),
    summarySubtotal: document.getElementById("summary-subtotal"),
    summaryShipping: document.getElementById("summary-shipping"),
    summaryTax: document.getElementById("summary-tax"),
    summaryDiscountRow: document.getElementById("summary-discount-row"),
    summaryDiscount: document.getElementById("summary-discount"),
    summaryTotal: document.getElementById("summary-total"),
    placeOrderBtn: document.getElementById("placeOrderBtn"),
    confirmedOrderId: document.getElementById("confirmed-order-id"),

    // Tracker Elements
    trackerOrderId: document.getElementById("tracker-order-id"),
    trackerProgressFill: document.getElementById("tracker-progress-fill"),
    trackerSteps: document.querySelectorAll(".tracker-step"),
    trackerRecipient: document.getElementById("tracker-recipient"),
    trackerAddress: document.getElementById("tracker-address"),
    trackerPhone: document.getElementById("tracker-phone"),
    trackerPayment: document.getElementById("tracker-payment"),
    trackerTotal: document.getElementById("tracker-total"),
    trackerItemsContainer: document.getElementById("tracker-items"),

    // Cart Page Elements
    cartPageItems: document.getElementById("cart-page-items"),
    cartPageSubtotal: document.getElementById("cart-page-subtotal"),
    cartPageCount: document.getElementById("cart-page-count"),
    checkoutPageBtn: document.getElementById("checkout-page-btn")
};

// --- INITIALIZE APPLICATION ---
const initializeApp = () => {
    state.cart = loadCart();
    initHistoryAPI();
    initRouter();
    initCart();
    initFilters();
    initCheckout();
    initCategoryCards();
    initMobileNav();
    initMobileFilterSheet();
    initDragDrop(addToCart);

    // Restore view from previous session (runs after all DOM is ready)
    _restoreSavedView();

    renderGrids();
    updateCartUI();
};

// Expose helpers for external module access
window.openCartDrawer = openCartDrawer;
window.switchView     = switchView;
window.getCart        = () => state.cart;

function formatINR(val) {
    return val.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function formatPriceHTML(val) {
    const num = val;
    const formatted = num.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dotIdx = formatted.indexOf('.');
    if (dotIdx === -1) return formatted;
    return formatted.slice(0, dotIdx) + '<small class="price-decimal">' + formatted.slice(dotIdx) + '</small>';
}

export function updateNavbarActiveState(activeViewOrSection) {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        const view = link.dataset.view;
        const underline = link.querySelector(".nav-underline");
        
        if (view === activeViewOrSection) {
            link.style.color = "var(--text-primary)";
            if (underline) {
                underline.style.transform = "scaleX(1)";
            }
        } else {
            link.style.color = "var(--text-secondary)";
            if (underline) {
                underline.style.transform = "scaleX(0)";
            }
        }
    });
}

// --- CLIENT-SIDE ROUTER ---
function initRouter() {
    DOM.navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            if (view) {
                if (view === "catalog-section") {
                    handleScrollNavigation("#catalog-section");
                    updateNavbarActiveState("catalog-section");
                } else if (view === "about-section") {
                    handleScrollNavigation("#about-section");
                    updateNavbarActiveState("about-section");
                } else if (view === "shop") {
                    // Reset shop to default category "All" and clear other filters
                    state.filters.category = "All";
                    state.filters.priceRange = [];
                    state.filters.rating = 0;
                    state.filters.searchQuery = "";
                    document.querySelectorAll(".filter-price, .filter-rating").forEach(cb => cb.checked = false);
                    
                    const allBtn = document.querySelector('.category-btn[data-category="All"]');
                    if (allBtn) {
                        allBtn.click();
                    } else {
                        renderGrids();
                    }
                    
                    switchView("shop");
                } else {
                    switchView(view);
                }
            }
        });
    });

    // Handle standard anchors / custom buttons inside pages
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-go-view]");
        if (target) {
            e.preventDefault();
            const view = target.dataset.goView;
            if (view === "catalog-section") {
                handleScrollNavigation("#catalog-section");
                updateNavbarActiveState("catalog-section");
            } else if (view === "about-section") {
                handleScrollNavigation("#about-section");
                updateNavbarActiveState("about-section");
            } else if (view === "shop") {
                // Reset shop
                state.filters.category = "All";
                state.filters.priceRange = [];
                state.filters.rating = 0;
                state.filters.searchQuery = "";
                document.querySelectorAll(".filter-price, .filter-rating").forEach(cb => cb.checked = false);
                
                const allBtn = document.querySelector('.category-btn[data-category="All"]');
                if (allBtn) {
                    allBtn.click();
                } else {
                    renderGrids();
                }
                
                switchView("shop");
            } else {
                switchView(view);
            }
        }
    });
}

function handleScrollNavigation(selector) {
    if (state.activeView !== "home") {
        switchView("home");
        setTimeout(() => {
            scrollToSection(selector);
        }, 150);
    } else {
        scrollToSection(selector);
    }
}

function scrollToSection(selector) {
    const el = document.querySelector(selector);
    if (el) {
        const headerOffset = 96; // Height of the capsule + pt-4 offset
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}

export function switchView(viewName, { replace = false } = {}) {
    state.activeView = viewName;
    _saveActiveView();

    // Reset all mobile overlays and restore body scroll
    resetMobileUI();
    
    // Close Drawer if open
    closeCartDrawer();

    // Toggle navigation highlights
    updateNavbarActiveState(viewName);

    // Toggle view containers with a micro-fade transition
    DOM.views.forEach(view => {
        if (view.id === `view-${viewName}`) {
            view.classList.remove("hidden");
            // Wait for display change to animate opacity
            setTimeout(() => {
                view.classList.add("active");
            }, 10);
        } else {
            view.classList.add("hidden");
            view.classList.remove("active");
        }
    });

    // Push history state (skip during initial load or replace)
    const stateObj = { view: viewName, timestamp: Date.now() };
    const url = viewName === "home" ? window.location.pathname : `?view=${viewName}`;
    if (replace) {
        history.replaceState(stateObj, "", url);
    } else {
        history.pushState(stateObj, "", url);
    }

    // Render corresponding reviews if entering review steps
    if (viewName === "cart") {
        renderCartPage();
    } else if (viewName === "checkout-review") {
        renderOrderReview();
    } else if (viewName === "order-tracker") {
        renderOrderTracker();
    } else if (viewName === "cart") {
        renderCartPage();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---- View State Persistence ---- */

const VIEW_STATE_KEY = "luxeCartViewState";

function _saveActiveView() {
    try {
        const data = {
            view: state.activeView,
            filters: state.activeView === "shop" ? {
                category: state.filters.category,
                priceMin: state.filters.priceMin,
                priceMax: state.filters.priceMax,
                searchQuery: state.filters.searchQuery,
                rating: state.filters.rating,
                sortOrder: state.filters.sortOrder,
                priceRange: state.filters.priceRange,
            } : null,
            timestamp: Date.now(),
        };
        localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(data));
    } catch (e) {
        /* ignore quota errors */
    }
}

function _loadSavedView() {
    try {
        const raw = localStorage.getItem(VIEW_STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function _restoreFilterUI(filters) {
    // Category buttons
    DOM.categoryBtns.forEach(b => {
        const isActive = b.dataset.category === filters.category;
        b.classList.toggle("active", isActive);
        const span = b.querySelector("span");
        if (span) {
            span.style.color = isActive ? "var(--text-primary)" : "";
            span.style.fontWeight = isActive ? "700" : "";
        }
        const indicator = b.querySelector(".category-indicator");
        if (indicator) indicator.style.transform = isActive ? "scaleX(1)" : "scaleX(0)";
    });

    // Sync sidebar category checkboxes with restored category
    document.querySelectorAll(".category-btn-checkbox").forEach(cb => {
        cb.checked = filters.category === "All"
            ? cb.value === "All"
            : cb.value.toLowerCase() === filters.category.toLowerCase()
                || (cb.value === "Apparel" && (filters.category === "Apparel" || filters.category === "Fashion"));
    });

    // Sidebar radio
    let radioValue = filters.category;
    if (radioValue === "Apparel") radioValue = "Fashion";
    const radio = document.querySelector(`.category-btn-radio[value="${radioValue}"]`);
    if (radio) radio.checked = true;

    const activeLabel = document.getElementById("active-category-label");
    if (activeLabel) {
        activeLabel.textContent = filters.category === "All" ? "All Products" : filters.category;
    }

    updateSubcategories(filters.category);

    // Price sliders
    const minSlider = document.getElementById("price-min-slider");
    const maxSlider = document.getElementById("price-max-slider");
    const minInput = document.getElementById("price-min-input");
    const maxInput = document.getElementById("price-max-input");
    if (minSlider) minSlider.value = filters.priceMin;
    if (maxSlider) maxSlider.value = filters.priceMax;
    if (minInput) minInput.value = filters.priceMin;
    if (maxInput) maxInput.value = filters.priceMax;

    const mobMinSlider = document.getElementById("mob-price-min-slider");
    const mobMaxSlider = document.getElementById("mob-price-max-slider");
    const mobMinInput = document.getElementById("mob-price-min-input");
    const mobMaxInput = document.getElementById("mob-price-max-input");
    if (mobMinSlider) mobMinSlider.value = filters.priceMin;
    if (mobMaxSlider) mobMaxSlider.value = filters.priceMax;
    if (mobMinInput) mobMinInput.value = filters.priceMin;
    if (mobMaxInput) mobMaxInput.value = filters.priceMax;

    // Search inputs
    document.querySelectorAll(".search-input").forEach(input => {
        input.value = filters.searchQuery || "";
    });
}

function _restoreSavedView() {
    const saved = _loadSavedView();
    console.log('[restore] saved state:', JSON.stringify(saved));
    if (!saved || !saved.view || saved.view === "home") return;

    // If on a checkout step with empty cart, redirect to shop
    const checkoutViews = ["checkout-shipping", "checkout-payment", "checkout-review"];
    if (checkoutViews.includes(saved.view) && state.cart.length === 0) {
        saved.view = "shop";
    }

    // Restore filter state before the view switch
    if (saved.view === "shop" && saved.filters) {
        // Migrate stale priceMax from old hardcoded value
        if (saved.filters.priceMax === 30000) {
            saved.filters.priceMax = MAX_PRICE;
        }
        Object.assign(state.filters, saved.filters);
        console.log('[restore] restored filters:', JSON.stringify(state.filters));
    }

    switchView(saved.view, { replace: true });

    // Restore filter UI elements after the view is shown
    if (saved.view === "shop" && saved.filters) {
        _restoreFilterUI(state.filters);
    }
}

function initHistoryAPI() {
    // Replace initial state so back from shop lands on home correctly
    history.replaceState({ view: "home", timestamp: Date.now() }, "", window.location.pathname);

    window.addEventListener("popstate", (e) => {
        const targetView = e.state?.view || "home";
        // Only switch if different and not during a programmatic push
        if (targetView !== state.activeView) {
            // Call switchView with replace=true so we don't push another state
            switchView(targetView, { replace: true });
        }
    });
}

// --- MOBILE UI HELPERS (used by both toggles and switchView) ---
function resetMobileUI() {
    // Close mobile nav panel
    const panel = document.getElementById("mobile-nav-panel");
    const panelIcon = document.getElementById("mobile-menu-icon");
    if (panel) {
        const slidePanel = panel.querySelector(".translate-x-full");
        if (slidePanel && !panel.classList.contains("hidden")) {
            slidePanel.classList.add("translate-x-full");
        }
        panel.classList.add("hidden");
    }
    if (panelIcon) panelIcon.textContent = "menu";

    // Close mobile filter sheet + backdrop
    const sheet = document.getElementById("mobile-filter-sheet");
    const sheetBackdrop = document.getElementById("mobile-filter-backdrop");
    if (sheet) {
        sheet.classList.remove("open", "flex");
        sheet.classList.add("translate-y-full", "hidden");
    }
    if (sheetBackdrop) {
        sheetBackdrop.classList.remove("open");
        sheetBackdrop.classList.add("hidden");
    }

    // Restore body scroll
    document.body.style.overflow = "";
}

// --- MOBILE NAV TOGGLE ---
let _mobileNavInitialized = false;
function initMobileNav() {
    if (_mobileNavInitialized) return;
    _mobileNavInitialized = true;

    const menuBtn = document.getElementById("mobile-menu-btn");
    const panel = document.getElementById("mobile-nav-panel");
    const backdrop = document.getElementById("mobile-nav-backdrop");
    const icon = document.getElementById("mobile-menu-icon");
    const slidePanel = panel?.querySelector(".translate-x-full");

    if (!menuBtn || !panel) return;

    function openMobileNav() {
        resetMobileUI(); // ensure no other overlay is open
        panel.classList.remove("hidden");
        // Reset shop accordion on menu open
        const collapse = document.getElementById("mobile-category-collapse");
        const arrow = document.getElementById("mobile-shop-arrow");
        if (collapse) { collapse.classList.add("max-h-0"); collapse.classList.remove("max-h-[500px]"); }
        if (arrow) arrow.style.transform = "rotate(0deg)";
        requestAnimationFrame(() => {
            if (slidePanel) slidePanel.classList.remove("translate-x-full");
        });
        if (icon) icon.textContent = "close";
        document.body.style.overflow = "hidden";
    }

    function closeMobileNav() {
        if (slidePanel) slidePanel.classList.add("translate-x-full");
        if (icon) icon.textContent = "menu";
        // Reset shop accordion
        const collapse = document.getElementById("mobile-category-collapse");
        const arrow = document.getElementById("mobile-shop-arrow");
        if (collapse) { collapse.classList.add("max-h-0"); collapse.classList.remove("max-h-[500px]"); }
        if (arrow) arrow.style.transform = "rotate(0deg)";
        document.body.style.overflow = "";
        setTimeout(() => {
            panel.classList.add("hidden");
        }, 300);
    }

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isHidden = panel.classList.contains("hidden");
        const isOffscreen = slidePanel?.classList.contains("translate-x-full");
        if (isHidden || isOffscreen) {
            openMobileNav();
        } else {
            closeMobileNav();
        }
    });

    if (backdrop) {
        backdrop.addEventListener("click", closeMobileNav);
    }

    // Shop category accordion toggle
    const shopToggle = document.getElementById("mobile-shop-toggle");
    const categoryCollapse = document.getElementById("mobile-category-collapse");
    const shopArrow = document.getElementById("mobile-shop-arrow");
    if (shopToggle && categoryCollapse) {
        shopToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = !categoryCollapse.classList.contains("max-h-0");
            if (isOpen) {
                categoryCollapse.classList.add("max-h-0");
                categoryCollapse.classList.remove("max-h-[500px]");
                if (shopArrow) shopArrow.style.transform = "rotate(0deg)";
            } else {
                categoryCollapse.classList.remove("max-h-0");
                categoryCollapse.classList.add("max-h-[500px]");
                if (shopArrow) shopArrow.style.transform = "rotate(180deg)";
            }
        });
    }

    panel.querySelectorAll(".nav-link, .mobile-category-btn").forEach(el => {
        el.addEventListener("click", () => {
            if (el.classList.contains("mobile-category-btn")) {
                const cat = el.dataset.category;
                const desktopBtn = document.querySelector(`.category-btn[data-category="${cat}"]`);
                if (desktopBtn) desktopBtn.click();
            }
            closeMobileNav();
        });
    });
}

// --- MOBILE FILTER BOTTOM SHEET ---
let _mobileFilterInitialized = false;
function initMobileFilterSheet() {
    if (_mobileFilterInitialized) return;
    _mobileFilterInitialized = true;

    const sheet = document.getElementById("mobile-filter-sheet");
    const backdrop = document.getElementById("mobile-filter-backdrop");
    const filterBtn = document.getElementById("mobile-filter-btn");
    const closeBtn = document.getElementById("mobile-filter-close");

    if (!sheet || !backdrop) return;

    function openSheet() {
        resetMobileUI(); // close nav panel first
        sheet.classList.remove("hidden", "translate-y-full");
        sheet.classList.add("flex", "open");
        backdrop.classList.remove("hidden");
        requestAnimationFrame(() => backdrop.classList.add("open"));
        document.body.style.overflow = "hidden";
    }

    function closeSheet() {
        sheet.classList.remove("open");
        sheet.classList.add("translate-y-full");
        backdrop.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(() => {
            sheet.classList.add("hidden");
            sheet.classList.remove("flex");
            backdrop.classList.add("hidden");
        }, 300);
    }

    if (filterBtn) filterBtn.addEventListener("click", openSheet);
    if (closeBtn) closeBtn.addEventListener("click", closeSheet);
    backdrop.addEventListener("click", closeSheet);

    // --- Mobile Price Slider ---
    const minSlider = document.getElementById("mob-price-min-slider");
    const maxSlider = document.getElementById("mob-price-max-slider");
    const minInput = document.getElementById("mob-price-min-input");
    const maxInput = document.getElementById("mob-price-max-input");
    const minLabel = document.getElementById("mob-price-min-label");
    const maxLabel = document.getElementById("mob-price-max-label");
    const track = document.getElementById("mob-price-slider-track");

    function updateMobPriceUI(minVal, maxVal) {
        if (minLabel) minLabel.textContent = `₹${minVal.toLocaleString('en-IN')}`;
        if (maxLabel) {
            maxLabel.textContent = maxVal >= MAX_PRICE ? `₹${(MAX_PRICE - 1).toLocaleString('en-IN')}+` : `₹${maxVal.toLocaleString('en-IN')}`;
        }
        if (track) {
            const minPercent = (minVal / MAX_PRICE) * 100;
            const maxPercent = (maxVal / MAX_PRICE) * 100;
            track.style.left = `${minPercent}%`;
            track.style.right = `${100 - maxPercent}%`;
        }
    }

    if (minSlider && maxSlider && minInput && maxInput) {
        updateMobPriceUI(state.filters.priceMin, state.filters.priceMax);

        minSlider.addEventListener("input", () => {
            let minVal = parseInt(minSlider.value) || 0;
            let maxVal = parseInt(maxSlider.value) || MAX_PRICE;
            if (minVal > maxVal - 500) { minVal = maxVal - 500; minSlider.value = minVal; }
            minSlider.style.zIndex = "25";
            maxSlider.style.zIndex = "20";
            state.filters.priceMin = minVal;
            minInput.value = minVal;
            updateMobPriceUI(minVal, maxVal);
        });

        maxSlider.addEventListener("input", () => {
            let minVal = parseInt(minSlider.value) || 0;
            let maxVal = parseInt(maxSlider.value) || MAX_PRICE;
            if (maxVal < minVal + 500) { maxVal = minVal + 500; maxSlider.value = maxVal; }
            maxSlider.style.zIndex = "25";
            minSlider.style.zIndex = "20";
            state.filters.priceMax = maxVal;
            maxInput.value = maxVal;
            updateMobPriceUI(minVal, maxVal);
        });

        minInput.addEventListener("change", () => {
            let minVal = parseInt(minInput.value);
            if (isNaN(minVal)) minVal = 0;
            let maxVal = state.filters.priceMax;
            if (minVal < 0) minVal = 0;
            if (minVal > maxVal - 500) minVal = maxVal - 500;
            state.filters.priceMin = minVal;
            minInput.value = minVal;
            minSlider.value = minVal;
            updateMobPriceUI(minVal, maxVal);
        });

        maxInput.addEventListener("change", () => {
            let maxVal = parseInt(maxInput.value);
            if (isNaN(maxVal)) maxVal = MAX_PRICE;
            let minVal = state.filters.priceMin;
            if (maxVal > MAX_PRICE) maxVal = MAX_PRICE;
            if (maxVal < minVal + 500) maxVal = minVal + 500;
            state.filters.priceMax = maxVal;
            maxInput.value = maxVal;
            maxSlider.value = maxVal;
            updateMobPriceUI(minVal, maxVal);
        });

        const handleEnter = (e) => { if (e.key === "Enter") e.target.blur(); };
        minInput.addEventListener("keypress", handleEnter);
        maxInput.addEventListener("keypress", handleEnter);
    }

    // Sync mobile price UI with desktop on apply (close sheet after)
    sheet.querySelectorAll(".apply-filters").forEach(btn => {
        btn.addEventListener("click", closeSheet);
    });

    // Sync mobile slider/reset UI when reset is clicked
    sheet.querySelectorAll(".reset-filters").forEach(btn => {
        btn.addEventListener("click", () => {
            state.filters.priceMin = 0;
            state.filters.priceMax = MAX_PRICE;
            if (minSlider) { minSlider.value = 0; minInput.value = 0; }
            if (maxSlider) { maxSlider.value = MAX_PRICE; maxInput.value = MAX_PRICE; }
            updateMobPriceUI(0, MAX_PRICE);
        });
    });
}

// --- DYNAMIC PRODUCT RENDERER & FILTERS ---
// --- SUBCATEGORY DATA AND UPDATE FUNCTIONS ---
const CATEGORY_TO_SUBCAT_KEY = {
    "apparel": "Fashion",
    "fashion": "Fashion",
    "fitness": "Sports & Fitness",
    "sports & fitness": "Sports & Fitness",
    "home decor": "Home & Kitchen",
    "home & kitchen": "Home & Kitchen",
    "beauty & personal care": "Beauty & Personal Care",
    "electronics": "Electronics",
    "accessories": "Accessories"
};

const SUBCATEGORIES = {
    "All": ["All"],
    "Electronics": ["Smartphones", "Laptops", "Audio", "Wearables", "Accessories"],
    "Fashion": ["Men's Wear", "Women's Wear", "Kids' Wear", "Footwear", "Fashion Accessories"],
    "Home & Kitchen": ["Furniture", "Decor", "Kitchen Appliances", "Cookware", "Bedding"],
    "Beauty & Personal Care": ["Skincare", "Haircare", "Makeup", "Fragrances", "Bath & Body"],
    "Sports & Fitness": ["Cardio Equipment", "Strength Training", "Yoga", "Outdoor Gear", "Sports Accessories"],
    "Accessories": ["Bags & Wallets", "Watches", "Sunglasses", "Jewellery", "Belts & Ties"]
};

function updateSubcategories(category) {
    const resolved = CATEGORY_TO_SUBCAT_KEY[category.toLowerCase()] || category;
    const subcats = SUBCATEGORIES[resolved] || SUBCATEGORIES["All"];
    const activeSub = state.filters.subcategory || "All";

    // Render top bar subcategory buttons
    const topContainer = document.getElementById("subcategory-buttons-container");
    if (topContainer) {
        topContainer.innerHTML = subcats.map(sub => `
            <button class="subcategory-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap ${sub === activeSub ? 'btn-primary font-bold shadow-sm' : 'btn-ghost'}" data-subcategory="${sub}">
                ${sub}
            </button>
        `).join('');
        topContainer.querySelectorAll(".subcategory-filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const sub = btn.dataset.subcategory;
                state.filters.subcategory = sub;
                updateSubcategories(category);
                renderGrids();
            });
        });
    }

    // Render sidebar subcategory checkboxes
    const sideContainer = document.getElementById("sidebar-subcategory-container");
    if (sideContainer) {
        sideContainer.innerHTML = subcats.map(sub => `
            <label class="flex items-center gap-unit-3 cursor-pointer py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <input type="checkbox" class="subcategory-checkbox text-[var(--accent-teal)] focus:ring-[var(--accent-teal)] rounded-sm bg-[var(--bg-card)] border-[var(--border-soft)]" value="${sub}" ${sub === activeSub ? 'checked' : ''} />
                <span class="text-sm font-medium">${sub}</span>
            </label>
        `).join('');
        sideContainer.querySelectorAll(".subcategory-checkbox").forEach(cb => {
            cb.addEventListener("change", () => {
                const checked = Array.from(sideContainer.querySelectorAll(".subcategory-checkbox:checked")).map(c => c.value);
                state.filters.subcategory = checked.length === 1 ? checked[0] : (checked.length > 1 ? "Multiple" : "All");
                // Sync top buttons: if one subcategory selected, highlight it; else reset to first
                if (topContainer) {
                    topContainer.querySelectorAll(".subcategory-filter-btn").forEach(b => {
                        const isActive = b.dataset.subcategory === state.filters.subcategory;
                        b.className = "subcategory-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap " + (isActive ? 'btn-primary font-bold shadow-sm' : 'btn-ghost');
                    });
                }
                renderGrids();
            });
        });
    }
}

function initFilters() {
    // Populate default subcategories on load
    updateSubcategories("All");
    // Bind sort selectors once (not on every renderGrids call)
    bindSortSelectors();

    // Category Sub-Nav Indicators
    DOM.categoryBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const category = btn.dataset.category;
            
            // Set active classes safely
            DOM.categoryBtns.forEach(b => {
                if (b.dataset.category === category) {
                    b.classList.add("active");
                    const span = b.querySelector("span");
                    if (span) {
                        span.style.color = "var(--text-primary)";
                        span.style.fontWeight = "700";
                    }
                    const indicator = b.querySelector(".category-indicator");
                    if (indicator) indicator.style.transform = "scaleX(1)";
                } else {
                    b.classList.remove("active");
                    const span = b.querySelector("span");
                    if (span) {
                        span.style.color = "";
                        span.style.fontWeight = "";
                    }
                    const indicator = b.querySelector(".category-indicator");
                    if (indicator) indicator.style.transform = "scaleX(0)";
                }
            });

            // If we are not in the shop view, switch to it
            if (state.activeView !== "shop") {
                switchView("shop");
            }

            // Sync with sidebar radio buttons
            let radioValue = category;
            if (category === "Apparel") radioValue = "Fashion";
            const radio = document.querySelector(`.category-btn-radio[value="${radioValue}"]`);
            if (radio) {
                radio.checked = true;
            }

            // Update in-page sticky filter tab state
            const activeLabel = document.getElementById("active-category-label");
            if (activeLabel) {
                activeLabel.textContent = category === "All" ? "All Products" : category;
            }
            updateSubcategories(category);

            state.filters.category = category;
            renderGrids();
        });
    });

    // Sidebar toggle behavior
    const sidebar = document.getElementById("shop-sidebar");
    const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
    const sidebarToggleIcon = document.getElementById("sidebar-toggle-icon");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");

    function updateBackdropState(isCollapsed) {
        if (sidebarBackdrop) {
            if (!isCollapsed && window.innerWidth < 768) {
                sidebarBackdrop.classList.add("active");
            } else {
                sidebarBackdrop.classList.remove("active");
            }
        }
    }

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            const isCollapsed = sidebar.classList.contains("collapsed");
            if (sidebarToggleIcon) {
                sidebarToggleIcon.textContent = isCollapsed ? "chevron_right" : "chevron_left";
            }
            updateBackdropState(isCollapsed);
        });

        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener("click", () => {
                sidebar.classList.add("collapsed");
                if (sidebarToggleIcon) {
                    sidebarToggleIcon.textContent = "chevron_right";
                }
                updateBackdropState(true);
            });
        }
    }

    // Price slider controls & inputs elements
    const minSlider = document.getElementById("price-min-slider");
    const maxSlider = document.getElementById("price-max-slider");
    const minInput = document.getElementById("price-min-input");
    const maxInput = document.getElementById("price-max-input");
    const minLabel = document.getElementById("price-min-label");
    const maxLabel = document.getElementById("price-max-label");
    const track = document.getElementById("price-slider-track");

    function updatePriceUI(minVal, maxVal) {
        if (minLabel) minLabel.textContent = `₹${minVal.toLocaleString('en-IN')}`;
        if (maxLabel) {
            if (maxVal >= MAX_PRICE) {
                maxLabel.textContent = `₹${(MAX_PRICE - 1).toLocaleString('en-IN')}+`;
            } else {
                maxLabel.textContent = `₹${maxVal.toLocaleString('en-IN')}`;
            }
        }
        if (track) {
            const minPercent = (minVal / MAX_PRICE) * 100;
            const maxPercent = (maxVal / MAX_PRICE) * 100;
            track.style.left = `${minPercent}%`;
            track.style.right = `${100 - maxPercent}%`;
        }
    }

    if (minSlider && maxSlider && minInput && maxInput) {
        // Init UI on load
        updatePriceUI(state.filters.priceMin, state.filters.priceMax);

        // Min Slider Listener
        minSlider.addEventListener("input", () => {
            let minVal = parseInt(minSlider.value) || 0;
            let maxVal = parseInt(maxSlider.value) || MAX_PRICE;
            
            // Enforce margin of 500
            if (minVal > maxVal - 500) {
                minVal = maxVal - 500;
                minSlider.value = minVal;
            }
            
            // Adjust z-indexes to prevent overlap issues
            minSlider.style.zIndex = "25";
            maxSlider.style.zIndex = "20";
            
            state.filters.priceMin = minVal;
            minInput.value = minVal;
            updatePriceUI(minVal, maxVal);
        });

        // Max Slider Listener
        maxSlider.addEventListener("input", () => {
            let minVal = parseInt(minSlider.value) || 0;
            let maxVal = parseInt(maxSlider.value) || MAX_PRICE;
            
            // Enforce margin of 500
            if (maxVal < minVal + 500) {
                maxVal = minVal + 500;
                maxSlider.value = maxVal;
            }
            
            // Adjust z-indexes to prevent overlap issues
            maxSlider.style.zIndex = "25";
            minSlider.style.zIndex = "20";
            
            state.filters.priceMax = maxVal;
            maxInput.value = maxVal;
            updatePriceUI(minVal, maxVal);
        });

        // Min Input Listener (Manual typing)
        minInput.addEventListener("change", () => {
            let minVal = parseInt(minInput.value);
            if (isNaN(minVal)) minVal = 0;
            
            let maxVal = state.filters.priceMax;
            
            // Clamp and validate
            if (minVal < 0) minVal = 0;
            if (minVal > maxVal - 500) minVal = maxVal - 500;
            
            state.filters.priceMin = minVal;
            minInput.value = minVal;
            minSlider.value = minVal;
            updatePriceUI(minVal, maxVal);
        });

        // Max Input Listener (Manual typing)
        maxInput.addEventListener("change", () => {
            let maxVal = parseInt(maxInput.value);
            if (isNaN(maxVal)) maxVal = MAX_PRICE;
            
            let minVal = state.filters.priceMin;
            
            // Clamp and validate
            if (maxVal > MAX_PRICE) maxVal = MAX_PRICE;
            if (maxVal < minVal + 500) maxVal = minVal + 500;
            
            state.filters.priceMax = maxVal;
            maxInput.value = maxVal;
            maxSlider.value = maxVal;
            updatePriceUI(minVal, maxVal);
        });

        const handleEnterKey = (e) => {
            if (e.key === "Enter") {
                e.target.blur(); // triggers change event
            }
        };
        minInput.addEventListener("keypress", handleEnterKey);
        maxInput.addEventListener("keypress", handleEnterKey);
    }

    // Keep active checks for interactive view checkbox filters
    document.querySelectorAll(".filter-price").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const val = checkbox.value;
            if (checkbox.checked) {
                state.filters.priceRange.push(val);
            } else {
                state.filters.priceRange = state.filters.priceRange.filter(item => item !== val);
            }
        });
    });

    // Rating filters
    document.querySelectorAll(".filter-rating").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const val = parseFloat(checkbox.value);
            if (checkbox.checked) {
                state.filters.rating = val;
                // Uncheck other rating checkboxes to make it single selection
                document.querySelectorAll(".filter-rating").forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
            } else {
                state.filters.rating = 0;
            }
        });
    });

    // Apply & Reset Filters triggers
    DOM.applyFiltersBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            renderGrids();
        });
    });

    DOM.resetFiltersBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Uncheck checkboxes
            document.querySelectorAll(".filter-price, .filter-rating").forEach(cb => cb.checked = false);
            state.filters.priceRange = [];
            state.filters.rating = 0;
            state.filters.category = "All";
            
            // Reset price limits state
            state.filters.priceMin = 0;
            state.filters.priceMax = MAX_PRICE;
            
            if (minSlider) minSlider.value = 0;
            if (maxSlider) maxSlider.value = MAX_PRICE;
            if (minInput) minInput.value = 0;
            if (maxInput) maxInput.value = MAX_PRICE;
            updatePriceUI(0, MAX_PRICE);
            
            // Trigger category btn reset to all
            DOM.categoryBtns.forEach(b => {
                if (b.dataset.category === "All") {
                    b.click();
                }
            });

            renderGrids();
        });
    });

    // Initialize Search and Filter module (Student 3A)
    initSearchAndFilters(state, DOM, renderGrids, addToCart, updateSubcategories);
}

function getFilteredProducts() {
    return getFilteredProductsSF(state);
}

function renderGrids() {
    let list;
    try {
        list = getFilteredProducts();
    } catch (err) {
        console.error('[renderGrids] getFilteredProducts threw:', err);
        list = [];
    }
    console.log('[renderGrids] filtered count:', list && list.length, 'activeView:', state.activeView, 'category:', state.filters.category, 'priceMin:', state.filters.priceMin, 'priceMax:', state.filters.priceMax, 'searchQuery:', state.filters.searchQuery, 'gridShop:', !!DOM.gridShop);
    
    const sortSelects = document.querySelectorAll(".sort-select");
    if (sortSelects.length > 0) {
        const order = sortSelects[0].value;
        if (order === "low-to-high") {
            list.sort((a, b) => a.price - b.price);
        } else if (order === "high-to-low") {
            list.sort((a, b) => b.price - a.price);
        } else {
            // Newest first (sequential IDs in mock products)
            list.sort((a, b) => b.id - a.id);
        }
    }

    // Toggle Empty state indicators
    toggleGridEmptyState(list.length);

    // Render HTML in all relevant grid views
    if (DOM.gridShop) DOM.gridShop.innerHTML = renderGridMarkup(list, "shop");
    if (DOM.gridInteractive) DOM.gridInteractive.innerHTML = renderGridMarkup(list, "interactive");
    if (DOM.gridAnimated) DOM.gridAnimated.innerHTML = renderGridMarkup(list, "animated");

    bindProductCardEvents();
}

function toggleGridEmptyState(count) {
    if (count === 0) {
        if (DOM.gridShop) DOM.gridShop.classList.add("hidden");
        if (DOM.gridInteractive) DOM.gridInteractive.classList.add("hidden");
        if (DOM.gridAnimated) DOM.gridAnimated.classList.add("hidden");

        if (DOM.emptyStateShop) DOM.emptyStateShop.classList.remove("hidden");
        if (DOM.emptyStateInteractive) DOM.emptyStateInteractive.classList.remove("hidden");
        if (DOM.emptyStateAnimated) DOM.emptyStateAnimated.classList.remove("hidden");
    } else {
        if (DOM.gridShop) DOM.gridShop.classList.remove("hidden");
        if (DOM.gridInteractive) DOM.gridInteractive.classList.remove("hidden");
        if (DOM.gridAnimated) DOM.gridAnimated.classList.remove("hidden");

        if (DOM.emptyStateShop) DOM.emptyStateShop.classList.add("hidden");
        if (DOM.emptyStateInteractive) DOM.emptyStateInteractive.classList.add("hidden");
        if (DOM.emptyStateAnimated) DOM.emptyStateAnimated.classList.add("hidden");
    }
}

function renderGridMarkup(items, type) {
    const isShop = type === "shop";
    return items.map(item => {
        const ratingStars = Math.round(item.rating);
        const formatPrice = formatPriceHTML(item.price);
        
        // Tags
        let tagHtml = "";
        if (item.rating >= 4.9) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-amber)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">Elite</div>`;
        } else if (item.id % 7 === 0) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-teal)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">New</div>`;
        }

        if (isShop) {
            return `
        <div class="card-dark group product-card rounded-xl p-unit-4 shadow-sm" 
             data-product-id="${item.id}" 
             data-name="${item.title}" 
             data-price="${item.price}" 
             data-category="${item.category}">
            <div class="aspect-square bg-[var(--bg-card)] rounded-lg mb-unit-4 overflow-hidden relative">
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" loading="lazy" />
                ${tagHtml}
                <button class="add-favorite-btn absolute top-unit-2 right-unit-2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">favorite</span>
                </button>
            </div>
            <div class="flex flex-col gap-unit-1">
                <div class="flex items-start justify-between gap-1">
                    <span class="font-label-md text-label-md text-[var(--accent-silver)] uppercase tracking-widest truncate">${item.category}</span>
                    <div class="flex items-center gap-[2px] shrink-0">
                        <span class="material-symbols-outlined text-[var(--accent-amber)] text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                        <span class="text-label-md font-bold text-[var(--text-secondary)]">${item.rating.toFixed(1)}</span>
                    </div>
                </div>
                <h3 class="font-headline-md text-headline-md text-[var(--text-primary)] truncate">${item.title}</h3>
                <div class="flex items-center justify-between gap-2 mt-unit-1">
                    <span class="text-[var(--text-primary)] font-bold text-body-lg">${formatPrice}</span>
                    <button class="quick-add-btn shrink-0 py-unit-2 px-unit-4 rounded-lg font-label-md text-label-md active:scale-95">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
            `;
        }

        return `
        <div class="card-dark group product-card rounded-xl p-unit-4 shadow-sm" 
             data-product-id="${item.id}" 
             data-name="${item.title}" 
             data-price="${item.price}" 
             data-category="${item.category}">
            <div class="aspect-square bg-[var(--bg-card)] rounded-lg mb-unit-4 overflow-hidden relative">
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" loading="lazy" />
                ${tagHtml}
                <button class="add-favorite-btn absolute top-unit-2 right-unit-2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">favorite</span>
                </button>
            </div>
            <div class="flex flex-col gap-unit-1">
                <span class="font-label-md text-label-md text-[var(--accent-silver)] uppercase tracking-widest">${item.category}</span>
                <h3 class="font-headline-md text-headline-md text-[var(--text-primary)] truncate">${item.title}</h3>
                <div class="flex justify-between items-center mt-unit-2">
                    <span class="text-[var(--text-primary)] font-bold text-body-lg">${formatPrice}</span>
                    <div class="flex items-center gap-unit-1">
                        <span class="material-symbols-outlined text-[var(--accent-amber)] text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                        <span class="text-label-md font-bold text-[var(--text-secondary)]">${item.rating.toFixed(1)}</span>
                    </div>
                </div>
                <button class="quick-add-btn mt-unit-4 w-full py-unit-2 rounded-lg font-label-md text-label-md active:scale-95">
                    Add to Cart
                </button>
            </div>
        </div>
        `;
    }).join("");
}

// Bind quick-add buttons & sort selectors
function bindProductCardEvents() {
    bindProductCardEventsSF(products, addToCart);
}

// Sort binding (called once from initFilters to avoid duplicate listeners)
let _sortBound = false;
function bindSortSelectors() {
    if (_sortBound) return;
    _sortBound = true;
    document.querySelectorAll(".sort-select").forEach(select => {
        select.addEventListener("change", () => {
            document.querySelectorAll(".sort-select").forEach(sel => {
                if (sel !== select) sel.value = select.value;
            });
            renderGrids();
        });
    });
}

// --- GLOBAL CART CONTROLS ---
function initCart() {
    // Header cart buttons — navigate to cart page
    document.querySelectorAll(".cart-drawer-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            switchView("cart");
        });
    });

    DOM.cartBackdrop.addEventListener("click", closeCartDrawer);
    document.querySelectorAll(".close-cart-btn").forEach(btn => {
        btn.addEventListener("click", closeCartDrawer);
    });

    // Clear All Cart items
    document.querySelectorAll(".clear-cart-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            state.cart = [];
            clearCartStorage();
            updateCartUI();
        });
    });

    // Go to checkout from drawer
    DOM.checkoutDrawerBtn.addEventListener("click", () => {
        if (state.cart.length === 0) {
            alert("Your shopping cart is empty!");
            return;
        }
        switchView("checkout-shipping");
    });

    // Cart page checkout button
    if (DOM.checkoutPageBtn) {
        DOM.checkoutPageBtn.addEventListener("click", () => {
            if (state.cart.length === 0) return;
            switchView("checkout-shipping");
        });
    }
}

function toggleCartDrawer() {
    const isClosed = DOM.cartDrawer.classList.contains("translate-x-full");
    if (isClosed) {
        openCartDrawer();
    } else {
        closeCartDrawer();
    }
}

function openCartDrawer() {
    DOM.cartDrawer.classList.remove("translate-x-full");
    DOM.cartBackdrop.classList.remove("hidden");
    setTimeout(() => DOM.cartBackdrop.classList.add("opacity-100"), 10);
}

function closeCartDrawer() {
    DOM.cartDrawer.classList.add("translate-x-full");
    DOM.cartBackdrop.classList.remove("opacity-100");
    setTimeout(() => DOM.cartBackdrop.classList.add("hidden"), 300);
}

function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ ...product, qty: 1 });
    }
    saveCart(state.cart);
    updateCartUI();
    animateCartIcons();
}

function updateCartUI() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Update nav counter badges
    DOM.cartCountBadges.forEach(badge => {
        badge.textContent = totalCount;
        if (totalCount === 0) {
            badge.classList.add("hidden");
        } else {
            badge.classList.remove("hidden");
        }
    });

    // Update Drawer list
    if (state.cart.length === 0) {
        DOM.cartItemsContainer.classList.add("hidden");
        DOM.checkoutDrawerBtn.disabled = true;
    } else {
        DOM.cartItemsContainer.classList.remove("hidden");
        DOM.checkoutDrawerBtn.disabled = false;

        DOM.cartItemsContainer.innerHTML = state.cart.map((item, index) => {
            const formatPrice = formatPriceHTML(item.price * item.qty);
            return `
            <div class="flex gap-unit-3 bg-[var(--bg-card)] p-unit-3 rounded-lg border border-[var(--border-muted)] transition-all hover:border-[var(--accent-teal)]/30">
                <div class="w-16 h-16 bg-[var(--bg-elevated)] rounded-md overflow-hidden flex-shrink-0">
                     <img src="${item.image}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="flex-grow min-w-0">
                    <h4 class="font-bold text-[var(--text-primary)] text-body-md truncate">${item.title}</h4>
                    <p class="text-[var(--accent-teal)] font-bold text-label-md">${formatPrice}</p>
                    <div class="flex items-center gap-unit-2 mt-unit-1">
                        <button class="qty-btn bg-[var(--bg-elevated)] w-5 h-5 rounded flex items-center justify-center text-label-md text-[var(--text-primary)]" data-idx="${index}" data-act="dec">-</button>
                        <span class="text-body-md font-bold text-[var(--text-primary)]">${item.qty}</span>
                        <button class="qty-btn bg-[var(--bg-elevated)] w-5 h-5 rounded flex items-center justify-center text-label-md text-[var(--text-primary)]" data-idx="${index}" data-act="inc">+</button>
                    </div>
                </div>
                <button class="remove-cart-item-btn material-symbols-outlined text-[var(--text-muted)] hover:text-[var(--error)] transition-colors" data-idx="${index}">delete</button>
            </div>
            `;
        }).join("");

        // Qty adjust buttons event bind
        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx);
                const act = btn.dataset.act;
                if (act === "inc") {
                    state.cart[idx].qty++;
                } else {
                    state.cart[idx].qty--;
                    if (state.cart[idx].qty <= 0) {
                        state.cart.splice(idx, 1);
                    }
                }
                saveCart(state.cart);
                updateCartUI();
            });
        });

        // Individual remove buttons event bind
        document.querySelectorAll(".remove-cart-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx);
                state.cart.splice(idx, 1);
                saveCart(state.cart);
                updateCartUI();
            });
        });
    }

    // Update total price displays
    DOM.cartTotalDisplay.innerHTML = formatPriceHTML(subtotal);

    // Sync cart page if visible
    if (state.activeView === "cart") {
        renderCartPage();
    }
}

function animateCartIcons() {
    DOM.cartCountBadges.forEach(badge => {
        badge.classList.add("scale-125");
        setTimeout(() => badge.classList.remove("scale-125"), 200);
    });
}

function renderCartPage() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const formatPriceHTML_local = (val) => {
        const num = val;
        const formatted = num.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const dotIdx = formatted.indexOf('.');
        return dotIdx === -1 ? formatted : formatted.slice(0, dotIdx) + '<small class="price-decimal">' + formatted.slice(dotIdx) + '</small>';
    };

    if (DOM.cartPageCount) {
        DOM.cartPageCount.textContent = `${totalCount} item${totalCount !== 1 ? 's' : ''}`;
    }
    if (DOM.cartPageSubtotal) {
        DOM.cartPageSubtotal.innerHTML = formatPriceHTML_local(subtotal);
    }
    if (DOM.checkoutPageBtn) {
        DOM.checkoutPageBtn.disabled = totalCount === 0;
    }

    if (!DOM.cartPageItems) return;

    if (totalCount === 0) {
        DOM.cartPageItems.innerHTML = `
            <div class="text-center py-unit-16 text-[var(--text-muted)]">
                <span class="material-symbols-outlined text-5xl block mb-unit-4">shopping_cart</span>
                <p class="font-body-lg text-body-lg">Your cart is empty</p>
                <button data-go-view="shop" class="btn-primary mt-unit-4 px-unit-6 py-unit-2 rounded-lg font-label-md text-label-md inline-flex items-center gap-unit-2">
                    Start Shopping
                </button>
            </div>
        `;
        return;
    }

    DOM.cartPageItems.innerHTML = state.cart.map((item, index) => {
        const lineTotal = formatPriceHTML_local(item.price * item.qty);
        const unitPrice = formatPriceHTML_local(item.price);
        return `
            <div class="card-dark p-unit-4 rounded-xl flex flex-col sm:flex-row gap-unit-4" data-cart-idx="${index}">
                <div class="w-full sm:w-24 h-48 sm:h-24 bg-[var(--bg-card)] rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start gap-unit-2">
                        <div class="min-w-0 flex-1">
                            <h3 class="font-headline-md text-headline-md font-bold text-[var(--text-primary)] truncate">${item.title}</h3>
                            <p class="font-label-md text-label-md text-[var(--accent-silver)] uppercase tracking-widest mt-unit-1 truncate">${item.category}</p>
                        </div>
                        <span class="font-body-lg text-body-lg font-bold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">${lineTotal}</span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between mt-unit-4 gap-unit-2">
                        <div class="flex items-center gap-unit-3 flex-wrap">
                            <span class="font-label-md text-label-md text-[var(--text-muted)]">${unitPrice}</span>
                            <div class="flex items-center gap-unit-2 bg-[var(--bg-elevated)] rounded-lg px-unit-2 py-unit-1">
                                <button class="qty-page-btn w-7 h-7 rounded flex items-center justify-center text-label-md text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors" data-idx="${index}" data-act="dec">−</button>
                                <span class="text-body-md font-bold text-[var(--text-primary)] min-w-[24px] text-center">${item.qty}</span>
                                <button class="qty-page-btn w-7 h-7 rounded flex items-center justify-center text-label-md text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors" data-idx="${index}" data-act="inc">+</button>
                            </div>
                        </div>
                        <button class="remove-page-btn flex items-center gap-unit-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors font-label-md text-label-md self-end sm:self-auto" data-idx="${index}">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    DOM.cartPageItems.querySelectorAll(".qty-page-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            const act = btn.dataset.act;
            if (act === "inc") {
                state.cart[idx].qty++;
            } else {
                state.cart[idx].qty--;
                if (state.cart[idx].qty <= 0) {
                    state.cart.splice(idx, 1);
                }
            }
            saveCart(state.cart);
            updateCartUI();
        });
    });

    DOM.cartPageItems.querySelectorAll(".remove-page-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            state.cart.splice(idx, 1);
            saveCart(state.cart);
            updateCartUI();
        });
    });
}

// --- CHECKOUT FUNNEL COORDINATORS ---
function initCheckout() {
    // 1. Shipping form submission — validate with checkout_validator, then advance
    if (DOM.shippingForm) {
        // Wire up live inline error clearing on blur for each field
        const fieldValidators = [
            { name: 'fullName', fn: validateFullName },
            { name: 'email',    fn: validateEmail    },
            { name: 'phone',    fn: validatePhone    },
            { name: 'street',   fn: validateStreet   },
            { name: 'city',     fn: validateCity     },
            { name: 'pincode',  fn: validatePincode  },
        ];

        fieldValidators.forEach(({ name, fn }) => {
            const input = DOM.shippingForm.querySelector(`[name="${name}"]`);
            const errorEl = DOM.shippingForm.querySelector(`#shipping-${name}-error`);
            if (!input || !errorEl) return;

            input.addEventListener('blur', () => {
                const result = fn(input.value);
                errorEl.textContent = result.valid ? '' : result.message;
                input.classList.toggle('input-error', !result.valid);
                input.classList.toggle('input-valid', result.valid && input.value.trim() !== '');
            });

            input.addEventListener('input', () => {
                if (errorEl.textContent) {
                    const result = fn(input.value);
                    if (result.valid) {
                        errorEl.textContent = '';
                        input.classList.remove('input-error');
                        input.classList.add('input-valid');
                    }
                }
            });
        });

        DOM.shippingForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Run all validators and collect errors
            let hasError = false;
            fieldValidators.forEach(({ name, fn }) => {
                const input   = DOM.shippingForm.querySelector(`[name="${name}"]`);
                const errorEl = DOM.shippingForm.querySelector(`#shipping-${name}-error`);
                if (!input || !errorEl) return;
                const result = fn(input.value);
                errorEl.textContent = result.valid ? '' : result.message;
                input.classList.toggle('input-error', !result.valid);
                input.classList.toggle('input-valid', result.valid);
                if (!result.valid) hasError = true;
            });

            if (hasError) return;

            // All valid — write to state and advance
            const fd = new FormData(DOM.shippingForm);
            state.shippingAddress.recipient    = fd.get("fullName") || state.shippingAddress.recipient;
            state.shippingAddress.line1        = fd.get("street")   || state.shippingAddress.line1;
            state.shippingAddress.cityStateZip = `${fd.get("city") || ''}, ${fd.get("pincode") || ''}`.trim().replace(/^,\s*/, '');
            state.shippingAddress.country      = 'India';
            state.shippingAddress.phone        = fd.get("phone")    || state.shippingAddress.phone;
            // Store email in a dedicated state slot for review
            state.shippingAddress.email        = fd.get("email")    || '';

            switchView("checkout-payment");
        });
    }

    // 2. Payment form — method selection + conditional validation
    if (DOM.paymentForm) {
        const form = DOM.paymentForm;

        // helpers
        function luhn(num) {
            const digits = num.replace(/\D/g, '').split('').reverse();
            let sum = 0;
            digits.forEach((d, i) => {
                let n = parseInt(d);
                if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
                sum += n;
            });
            return sum % 10 === 0;
        }
        function detectCard(num) {
            if (/^4/.test(num))                                  return { type: 'visa',       label: 'Visa',       maxLen: 16 };
            if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num))     return { type: 'mastercard', label: 'Mastercard', maxLen: 16 };
            if (/^3[47]/.test(num))                              return { type: 'amex',       label: 'Amex',       maxLen: 15 };
            return null;
        }
        function pmErr(id, msg) {
            const el = form.querySelector(`#${id}`);
            if (el) el.textContent = msg;
        }
        function pmClear(id) {
            const el = form.querySelector(`#${id}`);
            if (el) el.textContent = '';
        }

        // Radio visual selection behaviour
        form.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Reset all option cards
                form.querySelectorAll('.payment-method-option').forEach(label => {
                    label.classList.remove('border-[var(--accent-teal)]', 'bg-[var(--bg-elevated)]');
                    label.classList.add('border-[var(--border-soft)]', 'bg-[var(--bg-card)]');
                    label.querySelector('.pm-radio-dot').classList.add('hidden');
                    label.querySelector('.pm-radio-indicator').classList.remove('border-[var(--accent-teal)]');
                });
                // Highlight selected card
                const selected = form.querySelector(`label[id="pm-${radio.value}-label"]`);
                if (selected) {
                    selected.classList.add('border-[var(--accent-teal)]', 'bg-[var(--bg-elevated)]');
                    selected.classList.remove('border-[var(--border-soft)]', 'bg-[var(--bg-card)]');
                    selected.querySelector('.pm-radio-dot').classList.remove('hidden');
                    selected.querySelector('.pm-radio-indicator').classList.add('border-[var(--accent-teal)]');
                }
                // Show/hide panels
                form.querySelector('#pm-cod-panel').classList.toggle('hidden', radio.value !== 'cod');
                form.querySelector('#pm-upi-panel').classList.toggle('hidden', radio.value !== 'upi');
                form.querySelector('#pm-card-panel').classList.toggle('hidden', radio.value !== 'card');
                pmClear('payment-method-error');
                // Clear sub-field errors when switching methods
                ['pm-upi-error','pm-cardName-error','pm-cardNum-error','pm-expiry-error','pm-cvv-error'].forEach(pmClear);
            });
        });

        // Live card number formatting + Luhn feedback
        const cardNumInput = form.querySelector('#pm-card-number');
        if (cardNumInput) {
            cardNumInput.addEventListener('input', (e) => {
                const raw     = e.target.value.replace(/\D/g, '');
                const card    = detectCard(raw);
                const maxLen  = card ? card.maxLen : 16;
                const trimmed = raw.slice(0, maxLen);
                e.target.value = trimmed.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                const errEl = form.querySelector('#pm-cardNum-error');
                if (!card) {
                    if (errEl) { errEl.style.color = 'var(--error)'; }
                    pmErr('pm-cardNum-error', trimmed.length > 0 ? 'Unknown card — enter Visa, Mastercard, or Amex' : '');
                    return;
                }
                if (trimmed.length === maxLen) {
                    if (luhn(trimmed)) {
                        if (errEl) { errEl.style.color = '#4caf50'; errEl.textContent = `✓ Valid ${card.label} card`; }
                    } else {
                        if (errEl) errEl.style.color = 'var(--error)';
                        pmErr('pm-cardNum-error', `Invalid ${card.label} number`);
                    }
                } else {
                    if (errEl) { errEl.style.color = '#888888'; errEl.textContent = `${card.label} — keep typing`; }
                }
            });
        }

        // Live expiry auto-format MM/YY
        const expiryInput = form.querySelector('#pm-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
                e.target.value = val;
                if (val.length === 5) {
                    const [mm, yy] = val.split('/').map(Number);
                    const now = new Date();
                    const expYear = 2000 + yy;
                    if (mm < 1 || mm > 12)              pmErr('pm-expiry-error', 'Invalid month');
                    else if (expYear > now.getFullYear() + 20) pmErr('pm-expiry-error', 'Invalid expiry year');
                    else if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1))
                                                         pmErr('pm-expiry-error', 'Card has expired');
                    else                                 pmClear('pm-expiry-error');
                } else { pmClear('pm-expiry-error'); }
            });
        }

        // CVV digits only
        const cvvInput = form.querySelector('#pm-cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
            cvvInput.addEventListener('blur', () => {
                const val        = cvvInput.value;
                const raw        = cardNumInput ? cardNumInput.value.replace(/\D/g, '') : '';
                const expectLen  = detectCard(raw)?.type === 'amex' ? 4 : 3;
                if (!val)                         pmErr('pm-cvv-error', 'CVV is required');
                else if (val.length !== expectLen) pmErr('pm-cvv-error', `CVV must be ${expectLen} digits`);
                else                              pmClear('pm-cvv-error');
            });
        }

        // UPI blur validation
        const upiInput = form.querySelector('#pm-upi-id');
        if (upiInput) {
            upiInput.addEventListener('blur', () => {
                const val = upiInput.value.trim();
                const re  = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z][a-zA-Z0-9]{2,}$/;
                if (!val)           pmErr('pm-upi-error', 'UPI ID is required');
                else if (!re.test(val)) pmErr('pm-upi-error', 'Enter a valid UPI ID (e.g. name@upi)');
                else                pmClear('pm-upi-error');
            });
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const method = form.querySelector('input[name="paymentMethod"]:checked')?.value;

            // Method must be selected
            if (!method) {
                pmErr('payment-method-error', 'Please select a payment method');
                return;
            }
            pmClear('payment-method-error');

            // --- Card validation ---
            if (method === 'card') {
                const cardRaw   = (cardNumInput?.value || '').replace(/\D/g, '');
                const card      = detectCard(cardRaw);
                const nameVal   = form.querySelector('#pm-card-name')?.value.trim() || '';
                const expiryVal = expiryInput?.value.trim() || '';
                const cvvVal    = cvvInput?.value || '';
                const expectCvv = card?.type === 'amex' ? 4 : 3;
                let ok = true;

                if (!nameVal) { pmErr('pm-cardName-error', 'Cardholder name is required'); ok = false; }
                else pmClear('pm-cardName-error');

                if (!card || cardRaw.length !== card.maxLen || !luhn(cardRaw)) {
                    pmErr('pm-cardNum-error', 'Enter a valid card number');
                    form.querySelector('#pm-cardNum-error').style.color = 'var(--error)';
                    ok = false;
                }

                if (expiryVal.length !== 5) { pmErr('pm-expiry-error', 'Enter expiry as MM/YY'); ok = false; }

                if (!cvvVal || cvvVal.length !== expectCvv) {
                    pmErr('pm-cvv-error', `CVV must be ${expectCvv} digits`);
                    ok = false;
                }

                if (!ok) return;

                const masked = '•••• ' + cardRaw.slice(-4);
                state.paymentMethod.type       = card.label;
                state.paymentMethod.cardNumber = masked;
                state.paymentMethod.expiry     = expiryVal;
            }

            // --- UPI validation ---
            if (method === 'upi') {
                const val = upiInput?.value.trim() || '';
                const re  = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z][a-zA-Z0-9]{2,}$/;
                if (!val || !re.test(val)) {
                    pmErr('pm-upi-error', 'Enter a valid UPI ID (e.g. name@upi)');
                    return;
                }
                state.paymentMethod.type       = 'UPI';
                state.paymentMethod.cardNumber = val;
                state.paymentMethod.expiry     = '—';
            }

            // --- COD (no extra fields needed) ---
            if (method === 'cod') {
                state.paymentMethod.type       = 'Cash on Delivery';
                state.paymentMethod.cardNumber = '—';
                state.paymentMethod.expiry     = '—';
            }

            switchView("checkout-review");
        });
    }

    // 3. Coupon code triggers
    if (DOM.applyCouponBtn) {
        DOM.applyCouponBtn.addEventListener("click", () => {
            const entered = DOM.couponInput.value.trim().toUpperCase();
            const match = coupons.find(c => c.code === entered);
            
            if (match) {
                state.appliedCoupon = match;
                DOM.couponMessage.textContent = `Coupon Applied: ${match.description}`;
                DOM.couponMessage.className = "text-label-md text-[var(--success)] font-bold mt-1";
            } else {
                state.appliedCoupon = null;
                DOM.couponMessage.textContent = "Invalid coupon code!";
                DOM.couponMessage.className = "text-label-md text-[var(--error)] font-bold mt-1";
            }
            renderOrderReview();
        });
    }

    // 4. Place Order Submission
    if (DOM.placeOrderBtn) {
        DOM.placeOrderBtn.addEventListener("click", () => {
            // Show processing status
            DOM.placeOrderBtn.disabled = true;
            DOM.placeOrderBtn.innerHTML = `<span class="material-symbols-outlined animate-spin" data-icon="progress_activity">progress_activity</span> Processing...`;

            setTimeout(() => {
                // Generate sequential LeapCart order details
                const randomId = "LX-" + Math.floor(10000 + Math.random() * 90000);
                state.currentOrderId = randomId;
                DOM.confirmedOrderId.textContent = randomId;
                
                // Switch to Confirmed Screen
                switchView("order-confirmed");
                
                // Clear the shopping cart
                state.cart = [];
                clearCartStorage();
                updateCartUI();

                // Restore Order Review Button markup
                DOM.placeOrderBtn.disabled = false;
                DOM.placeOrderBtn.innerHTML = `Place Order <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>`;
            }, 1800);
        });
    }
}

function renderOrderReview() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 1500 ? 0 : 499;
    const tax = Math.round(subtotal * 0.18);

    let discount = 0;
    if (state.appliedCoupon) {
        if (state.appliedCoupon.type === "percentage") {
            discount = Math.round(subtotal * (state.appliedCoupon.discountValue / 100));
        } else if (state.appliedCoupon.type === "fixed") {
            discount = state.appliedCoupon.discountValue;
        }
    }

    const total = Math.max(0, subtotal + shipping + tax - discount);

    DOM.summarySubtotal.innerHTML = formatPriceHTML(subtotal);
    DOM.summaryShipping.innerHTML = shipping === 0 ? "FREE" : formatPriceHTML(shipping);
    DOM.summaryTax.innerHTML = formatPriceHTML(tax);
    DOM.summaryTotal.innerHTML = formatPriceHTML(total);

    // Update discounts display row
    if (discount > 0) {
        DOM.summaryDiscountRow.classList.remove("hidden");
        DOM.summaryDiscount.innerHTML = `- ${formatPriceHTML(discount)}`;
    } else {
        DOM.summaryDiscountRow.classList.add("hidden");
    }

    // Populate delivery fields
    DOM.reviewRecipient.textContent = state.shippingAddress.recipient;
    DOM.reviewAddress.innerHTML = [
        state.shippingAddress.line1,
        state.shippingAddress.cityStateZip,
        state.shippingAddress.email ? `Email: ${state.shippingAddress.email}` : '',
        `Phone: ${state.shippingAddress.phone}`,
    ].filter(Boolean).join('<br>');
    DOM.reviewCardName.textContent = `${state.paymentMethod.type}${state.paymentMethod.cardNumber !== '—' ? ' · ' + state.paymentMethod.cardNumber : ''}`;
    DOM.reviewCardExpiry.textContent = state.paymentMethod.expiry !== '—' ? `Expires ${state.paymentMethod.expiry}` : state.paymentMethod.type;

    // Render review items
    DOM.reviewItemsContainer.innerHTML = state.cart.map(item => `
    <div class="flex gap-unit-6 pb-unit-6 border-b border-[var(--border-muted)]">
        <img src="${item.image}" alt="${item.title}" class="w-20 h-20 object-cover rounded-lg bg-[var(--bg-card)]" loading="lazy">
        <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
                <h3 class="font-body-lg text-body-lg font-bold text-[var(--text-primary)] truncate">${item.title}</h3>
                <p class="font-body-lg text-body-lg font-bold text-[var(--text-primary)] ml-4">${formatPriceHTML(item.price * item.qty)}</p>
            </div>
            <p class="font-body-md text-body-md text-[var(--text-secondary)] mb-unit-2">${item.category}</p>
            <div class="flex items-center gap-unit-2">
                <span class="font-label-md text-label-md px-unit-2 py-unit-1 bg-[var(--bg-card)] rounded text-[var(--text-primary)]">Qty: ${item.qty}</span>
            </div>
        </div>
    </div>
    `).join("");
}

// --- ORDER TRACKER STAGE COORDINATION ---
function renderOrderTracker() {
    DOM.trackerOrderId.textContent = state.currentOrderId;
    DOM.trackerRecipient.textContent = state.shippingAddress.recipient;
    DOM.trackerAddress.innerHTML = `${state.shippingAddress.line1}<br>${state.shippingAddress.cityStateZip}<br>${state.shippingAddress.country}`;
    DOM.trackerPhone.textContent = state.shippingAddress.phone;
    const pmDisplay = state.paymentMethod.cardNumber === '—'
        ? state.paymentMethod.type
        : `${state.paymentMethod.type} card ending in ${state.paymentMethod.cardNumber.slice(-4)}`;
    DOM.trackerPayment.textContent = pmDisplay;
    
    // Custom stepper trigger animations
    setTimeout(() => {
        // Play animated visual progress bars
        DOM.trackerProgressFill.className = "absolute top-5 left-4 h-1 bg-[var(--accent-teal)] rounded-full progress-bar-fill-33";
        DOM.trackerSteps.forEach((step, index) => {
            setTimeout(() => {
                step.classList.add("visible");
            }, 300 + (index * 150));
        });
    }, 200);

    // Mock tracking items (since order reviews cleared cart)
    DOM.trackerItemsContainer.innerHTML = `
    <div class="flex items-center gap-unit-4 py-unit-4 border-b border-[var(--border-muted)]">
        <div class="w-16 h-16 bg-[var(--bg-card)] rounded-lg overflow-hidden flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150" class="w-full h-full object-cover">
        </div>
        <div class="flex-grow">
            <h4 class="font-body-lg text-body-lg font-bold text-[var(--text-primary)]">SonicWave Pro Headphones</h4>
            <p class="text-[var(--text-secondary)] font-body-md text-body-md">Electronics | Qty: 1</p>
        </div>
        <span class="font-body-lg text-body-lg font-bold text-[var(--text-primary)]">₹12,999</span>
    </div>
    <div class="flex items-center gap-unit-4 py-unit-4">
        <div class="w-16 h-16 bg-[var(--bg-card)] rounded-lg overflow-hidden flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150" class="w-full h-full object-cover">
        </div>
        <div class="flex-grow">
            <h4 class="font-body-lg text-body-lg font-bold text-[var(--text-primary)]">Minimalist Leather Quartz Watch</h4>
            <p class="text-[var(--text-secondary)] font-body-md text-body-md">Accessories | Qty: 1</p>
        </div>
        <span class="font-body-lg text-body-lg font-bold text-[var(--text-primary)]">₹4,999</span>
    </div>
    `;

    DOM.trackerTotal.textContent = "₹17,998";
}

function initCategoryCards() {
    document.addEventListener("click", (e) => {
        const card = e.target.closest(".category-card");
        if (card) {
            e.preventDefault();
            const categoryName = card.dataset.category;
            if (categoryName) {
                switchView("shop");
                // Find matching category button in navbar and click it
                const sliderBtn = document.querySelector(`.category-btn[data-category="${categoryName}"]`);
                if (sliderBtn) {
                    sliderBtn.click();
                } else {
                    state.filters.category = categoryName;
                    renderGrids();
                }
            }
        }
    });
}

// Bootstrapping — placed at end so all const/function declarations exist
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
