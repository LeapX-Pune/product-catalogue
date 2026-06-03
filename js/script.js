import { products } from "./data/products.js";
import { coupons } from "./constants/coupons.js";
import { filterDefaults } from "./constants/filterDefaults.js";

// Global App State
const state = {
    cart: [],
    shippingAddress: {
        recipient: "Alexander Remington",
        line1: "1248 Luxury Lane, Suite 200",
        cityStateZip: "Beverly Hills, CA 90210",
        country: "United States",
        phone: "+1 (555) 012-3456"
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
        priceMax: 30000,
        rating: 0,
        searchQuery: "",
        sortOrder: "newest"
    }
};

// UI Elements
const DOM = {
    // Navigation / Views
    navLinks: document.querySelectorAll(".nav-link"),
    views: document.querySelectorAll(".view-container"),
    
    // Cart elements
    cartTrigger: document.getElementById("cart-trigger"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartBackdrop: document.getElementById("drawer-backdrop"),
    cartItemsContainer: document.getElementById("cart-items"),
    cartCountBadges: document.querySelectorAll(".cart-count"),
    cartTotalDisplay: document.getElementById("cart-total"),
    cartDropZone: document.getElementById("cart-drop-zone"),
    dropPlaceholder: document.getElementById("drop-zone-placeholder"),
    dropIcon: document.getElementById("drop-icon"),
    dropText: document.getElementById("drop-text"),
    successAnim: document.getElementById("success-animation"),
    checkoutDrawerBtn: document.getElementById("checkout-drawer-btn"),

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
    trackerItemsContainer: document.getElementById("tracker-items")
};

// --- INITIALIZE APPLICATION ---
document.addEventListener("DOMContentLoaded", () => {
    initRouter();
    initCart();
    initFilters();
    initCheckout();
    initCategoryCards();
    renderGrids();
    updateCartUI();
});

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

export function switchView(viewName) {
    state.activeView = viewName;
    
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

    // Render corresponding reviews if entering review steps
    if (viewName === "checkout-review") {
        renderOrderReview();
    } else if (viewName === "order-tracker") {
        renderOrderTracker();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- DYNAMIC PRODUCT RENDERER & FILTERS ---
// --- SUBCATEGORY DATA AND UPDATE FUNCTIONS ---
const SUBCATEGORIES = {
    "All": ["New Arrivals", "Best Sellers", "Trending", "Clearance"],
    "Apparel": ["All Apparel", "T-Shirts", "Jackets", "Activewear"],
    "Electronics": ["All Electronics", "Audio", "Smartwatches", "Computing"],
    "Accessories": ["All Accessories", "Timepieces", "Bags", "Lifestyle"],
    "Fitness": ["All Fitness", "Equipment", "Wearables", "Yoga"],
    "Home Decor": ["All Decor", "Lighting", "Cushions", "Vases"],
    "Home & Kitchen": ["All Kitchen", "Cookware", "Appliances", "Cutlery"]
};

function updateSubcategories(category) {
    const container = document.getElementById("subcategory-buttons-container");
    if (!container) return;
    
    const subcats = SUBCATEGORIES[category] || SUBCATEGORIES["All"];
    container.innerHTML = subcats.map((sub, idx) => `
        <button class="subcategory-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap ${idx === 0 ? 'btn-primary font-bold shadow-sm' : 'btn-ghost'}" data-subcategory="${sub}">
            ${sub}
        </button>
    `).join('');
    
    container.querySelectorAll(".subcategory-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".subcategory-filter-btn").forEach(b => {
                b.className = "subcategory-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap btn-ghost";
            });
            btn.className = "subcategory-filter-btn px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 whitespace-nowrap btn-primary font-bold shadow-sm";
        });
    });
}

function initFilters() {
    // Populate default subcategories on load
    updateSubcategories("All");

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
        // Initialize sidebar as collapsed on mobile by default to prevent blocking content
        if (window.innerWidth < 768) {
            sidebar.classList.add("collapsed");
            if (sidebarToggleIcon) {
                sidebarToggleIcon.textContent = "chevron_right";
            }
        }

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
            if (maxVal >= 30000) {
                maxLabel.textContent = "₹29,999+";
            } else {
                maxLabel.textContent = `₹${maxVal.toLocaleString('en-IN')}`;
            }
        }
        if (track) {
            const minPercent = (minVal / 30000) * 100;
            const maxPercent = (maxVal / 30000) * 100;
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
            let maxVal = parseInt(maxSlider.value) || 30000;
            
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
            let maxVal = parseInt(maxSlider.value) || 30000;
            
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
            if (isNaN(maxVal)) maxVal = 30000;
            
            let minVal = state.filters.priceMin;
            
            // Clamp and validate
            if (maxVal > 30000) maxVal = 30000;
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
            state.filters.priceMax = 30000;
            
            if (minSlider) minSlider.value = 0;
            if (maxSlider) maxSlider.value = 30000;
            if (minInput) minInput.value = 0;
            if (maxInput) maxInput.value = 30000;
            updatePriceUI(0, 30000);
            
            // Trigger category btn reset to all
            DOM.categoryBtns.forEach(b => {
                if (b.dataset.category === "All") {
                    b.click();
                }
            });

            renderGrids();
        });
    });

    // Text Search Search inputs
    DOM.searchInputs.forEach(input => {
        input.addEventListener("input", (e) => {
            state.filters.searchQuery = e.target.value;
            renderGrids();
        });
    });
}

function getFilteredProducts() {
    return products.filter(prod => {
        // 1. Category check
        if (state.filters.category !== "All" && prod.category.toLowerCase() !== state.filters.category.toLowerCase()) {
            return false;
        }

        // 2. Search query check
        if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase();
            const titleMatch = prod.title.toLowerCase().includes(query);
            const categoryMatch = prod.category.toLowerCase().includes(query);
            if (!titleMatch && !categoryMatch) return false;
        }

        // 3. Price range check
        if (state.activeView === "shop") {
            if (prod.price < state.filters.priceMin || prod.price > state.filters.priceMax) {
                return false;
            }
        } else {
            if (state.filters.priceRange.length > 0) {
                const inRange = state.filters.priceRange.some(range => {
                    if (range === "0-5000") return prod.price < 5000;
                    if (range === "5000-15000") return prod.price >= 5000 && prod.price <= 15000;
                    if (range === "15000-plus") return prod.price > 15000;
                    return false;
                });
                if (!inRange) return false;
            }
        }

        // 4. Rating check
        if (state.filters.rating > 0 && prod.rating < state.filters.rating) {
            return false;
        }

        return true;
    });
}

function renderGrids() {
    const list = getFilteredProducts();
    
    // Select sort orders if elements exist
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

    // Add drag event listeners & card hover listeners
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
    return items.map(item => {
        const ratingStars = Math.round(item.rating);
        const formatPrice = (item.price / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
        
        // Tags
        let tagHtml = "";
        if (item.rating >= 4.9) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-amber)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">Elite</div>`;
        } else if (item.id % 7 === 0) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-teal)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">New</div>`;
        }

        return `
        <div class="card-dark group cursor-grab active:cursor-grabbing product-card rounded-xl p-unit-4 shadow-sm" 
             data-product-id="${item.id}" 
             data-name="${item.title}" 
             data-price="${item.price}" 
             data-category="${item.category}" 
             draggable="true">
            <div class="aspect-square bg-[var(--bg-card)] rounded-lg mb-unit-4 overflow-hidden relative">
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" />
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

// Bind drag-and-drop & button quick-adds
function bindProductCardEvents() {
    const cards = document.querySelectorAll(".product-card");
    cards.forEach(card => {
        // Drag events
        card.addEventListener("dragstart", (e) => {
            const prodId = parseInt(card.dataset.productId);
            const item = products.find(p => p.id === prodId);
            if (item) {
                e.dataTransfer.setData("application/json", JSON.stringify(item));
                card.classList.add("product-card-dragging");
                
                // Show sliding drawer sneak peek
                if (DOM.cartDrawer.classList.contains("translate-x-full")) {
                    DOM.cartDrawer.classList.remove("translate-x-full");
                    DOM.cartDrawer.classList.add("translate-x-[90%]");
                }
            }
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("product-card-dragging");
            // Pull back drawer preview
            if (DOM.cartDrawer.classList.contains("translate-x-[90%]")) {
                DOM.cartDrawer.classList.add("translate-x-full");
                DOM.cartDrawer.classList.remove("translate-x-[90%]");
            }
        });

        // Quick add buttons click
        const addBtn = card.querySelector(".quick-add-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const prodId = parseInt(card.dataset.productId);
                const item = products.find(p => p.id === prodId);
                if (item) {
                    addToCart(item);
                    openCartDrawer();
                }
            });
        }
    });

    // Re-bind sort selectors change
    document.querySelectorAll(".sort-select").forEach(select => {
        select.addEventListener("change", () => {
            // Keep sort select choices aligned
            document.querySelectorAll(".sort-select").forEach(sel => {
                if (sel !== select) sel.value = select.value;
            });
            renderGrids();
        });
    });
}

// --- GLOBAL CART CONTROLS ---
function initCart() {
    // Header cart toggle buttons
    document.querySelectorAll(".cart-drawer-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            toggleCartDrawer();
        });
    });

    DOM.cartBackdrop.addEventListener("click", closeCartDrawer);
    document.querySelectorAll(".close-cart-btn").forEach(btn => {
        btn.addEventListener("click", closeCartDrawer);
    });

    // Drag over animations on the cart drop zones
    if (DOM.cartDropZone) {
        DOM.cartDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            DOM.cartDropZone.classList.add("drag-over");
            DOM.dropIcon.textContent = "download";
            DOM.dropText.textContent = "Drop to add";
            DOM.dropText.classList.remove("text-[var(--accent-teal)]/50");
            DOM.dropText.classList.add("text-[var(--accent-teal)]");
        });

        DOM.cartDropZone.addEventListener("dragleave", () => {
            DOM.cartDropZone.classList.remove("drag-over");
            resetDropZoneUI();
        });

        DOM.cartDropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            DOM.cartDropZone.classList.remove("drag-over");
            
            try {
                const item = JSON.parse(e.dataTransfer.getData("application/json"));
                addToCart(item);
                
                // Show drop checkmark pop
                DOM.successAnim.classList.remove("hidden");
                setTimeout(() => DOM.successAnim.classList.add("hidden"), 600);

                // Fully expand drawer
                openCartDrawer();
            } catch (err) {
                console.error("Invalid drop items", err);
            }
        });
    }

    // Clear All Cart items
    document.querySelectorAll(".clear-cart-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            state.cart = [];
            updateCartUI();
        });
    });

    // Go to checkout trigger
    DOM.checkoutDrawerBtn.addEventListener("click", () => {
        if (state.cart.length === 0) {
            alert("Your shopping cart is empty!");
            return;
        }
        switchView("checkout-shipping");
    });
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
    DOM.cartDrawer.classList.remove("translate-x-full", "translate-x-[90%]");
    DOM.cartBackdrop.classList.remove("hidden");
    setTimeout(() => DOM.cartBackdrop.classList.add("opacity-100"), 10);
}

function closeCartDrawer() {
    DOM.cartDrawer.classList.add("translate-x-full");
    DOM.cartDrawer.classList.remove("translate-x-[90%]");
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
        DOM.dropPlaceholder.classList.remove("hidden");
        resetDropZoneUI();
        DOM.checkoutDrawerBtn.disabled = true;
    } else {
        DOM.cartItemsContainer.classList.remove("hidden");
        DOM.dropPlaceholder.classList.add("hidden");
        DOM.checkoutDrawerBtn.disabled = false;

        DOM.cartItemsContainer.innerHTML = state.cart.map((item, index) => {
            const formatPrice = ((item.price * item.qty) / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
            return `
            <div class="flex gap-unit-3 bg-[var(--bg-card)] p-unit-3 rounded-lg border border-[var(--border-muted)] transition-all hover:border-[var(--accent-teal)]/30">
                <div class="w-16 h-16 bg-[var(--bg-elevated)] rounded-md overflow-hidden flex-shrink-0">
                     <img src="${item.image}" class="w-full h-full object-cover">
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
                <button class="remove-cart-item-btn material-symbols-outlined text-[var(--text-muted)] hover:text-[var(--error)] transition-colors" data-idx="${index}">close</button>
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
                updateCartUI();
            });
        });

        // Individual remove buttons event bind
        document.querySelectorAll(".remove-cart-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx);
                state.cart.splice(idx, 1);
                updateCartUI();
            });
        });
    }

    // Update total price displays
    const formatSubtotal = (subtotal / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
    DOM.cartTotalDisplay.textContent = formatSubtotal;
}

function resetDropZoneUI() {
    DOM.dropIcon.textContent = "add_shopping_cart";
    DOM.dropText.textContent = "Drag items here";
    DOM.dropText.className = "font-headline-md text-headline-md text-[var(--accent-teal)]/50";
}

function animateCartIcons() {
    DOM.cartCountBadges.forEach(badge => {
        badge.classList.add("scale-125");
        setTimeout(() => badge.classList.remove("scale-125"), 200);
    });
}

// --- CHECKOUT FUNNEL COORDINATORS ---
function initCheckout() {
    // 1. Shipping form submission
    if (DOM.shippingForm) {
        DOM.shippingForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(DOM.shippingForm);
            state.shippingAddress.recipient = formData.get("recipient") || state.shippingAddress.recipient;
            state.shippingAddress.line1 = formData.get("line1") || state.shippingAddress.line1;
            state.shippingAddress.cityStateZip = formData.get("cityStateZip") || state.shippingAddress.cityStateZip;
            state.shippingAddress.country = formData.get("country") || state.shippingAddress.country;
            state.shippingAddress.phone = formData.get("phone") || state.shippingAddress.phone;

            switchView("checkout-payment");
        });
    }

    // 2. Payment form submission
    if (DOM.paymentForm) {
        DOM.paymentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(DOM.paymentForm);
            
            // Mask card numbers
            const cardNum = formData.get("cardNumber") || "4111222233338842";
            const masked = "•••• " + cardNum.slice(-4);
            state.paymentMethod.cardNumber = masked;
            state.paymentMethod.expiry = formData.get("expiry") || state.paymentMethod.expiry;

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
                // Generate sequential LuxeCart order details
                const randomId = "LX-" + Math.floor(10000 + Math.random() * 90000);
                state.currentOrderId = randomId;
                DOM.confirmedOrderId.textContent = randomId;
                
                // Switch to Confirmed Screen
                switchView("order-confirmed");
                
                // Clear the shopping cart
                state.cart = [];
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
    const shipping = subtotal > 150000 ? 0 : 49900; // Free shipping over ₹1,500
    const tax = Math.round(subtotal * 0.18); // 18% GST standard Indian rate

    // Calculate discount
    let discount = 0;
    if (state.appliedCoupon) {
        if (state.appliedCoupon.type === "percentage") {
            discount = Math.round(subtotal * (state.appliedCoupon.discountValue / 100));
        } else if (state.appliedCoupon.type === "fixed") {
            discount = state.appliedCoupon.discountValue * 100; // Rs 500 fixed
        }
    }

    const total = Math.max(0, subtotal + shipping + tax - discount);

    // Format utility helper
    const formatINR = (val) => (val / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

    DOM.summarySubtotal.textContent = formatINR(subtotal);
    DOM.summaryShipping.textContent = shipping === 0 ? "FREE" : formatINR(shipping);
    DOM.summaryTax.textContent = formatINR(tax);
    DOM.summaryTotal.textContent = formatINR(total);

    // Update discounts display row
    if (discount > 0) {
        DOM.summaryDiscountRow.classList.remove("hidden");
        DOM.summaryDiscount.textContent = `- ${formatINR(discount)}`;
    } else {
        DOM.summaryDiscountRow.classList.add("hidden");
    }

    // Populate delivery fields
    DOM.reviewRecipient.textContent = state.shippingAddress.recipient;
    DOM.reviewAddress.innerHTML = `${state.shippingAddress.line1}<br>${state.shippingAddress.cityStateZip}<br>${state.shippingAddress.country}`;
    DOM.reviewCardName.textContent = `Visa Card ${state.paymentMethod.cardNumber}`;
    DOM.reviewCardExpiry.textContent = `Expires ${state.paymentMethod.expiry}`;

    // Render review items
    DOM.reviewItemsContainer.innerHTML = state.cart.map(item => `
    <div class="flex gap-unit-6 pb-unit-6 border-b border-[var(--border-muted)]">
        <img src="${item.image}" alt="${item.title}" class="w-20 h-20 object-cover rounded-lg bg-[var(--bg-card)]">
        <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
                <h3 class="font-body-lg text-body-lg font-bold text-[var(--text-primary)] truncate">${item.title}</h3>
                <p class="font-body-lg text-body-lg font-bold text-[var(--text-primary)] ml-4">${formatINR(item.price * item.qty)}</p>
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
    DOM.trackerPayment.textContent = `${state.paymentMethod.type} card ending in ${state.paymentMethod.cardNumber.slice(-4)}`;
    
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
import { renderProducts } from "./modules/catalog.js";
import "./modules/search.js";

renderProducts();

