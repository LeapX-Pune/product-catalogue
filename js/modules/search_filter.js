// *** student 3a start **

import { products } from "../data/products.js";

// Keep search history key and local cache
const SEARCH_HISTORY_KEY = 'luxeCartSearchHistory';
let searchTimeout = null;

// Helper to get search history from localStorage
function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

// Helper to save a query to search history
function saveSearchQuery(query) {
    if (!query || !query.trim()) return;
    let history = getSearchHistory();
    // Remove duplicates
    history = history.filter(q => q.toLowerCase() !== query.trim().toLowerCase());
    history.unshift(query.trim());
    if (history.length > 3) {
        history = history.slice(0, 3);
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

// Helper to render the search history dropdown
function renderSearchHistory(container, input, state, renderGridsFn) {
    // Remove existing dropdown if any
    const existing = container.querySelector('.search-history-dropdown');
    if (existing) existing.remove();

    const history = getSearchHistory();
    if (history.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'search-history-dropdown absolute top-full left-0 mt-2 w-full bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-lg shadow-xl overflow-hidden z-50 flex flex-col';

    history.forEach(item => {
        const row = document.createElement('div');
        row.className = 'px-unit-3 py-unit-2 text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer flex items-center gap-2 transition-colors';
        row.innerHTML = `<span class="material-symbols-outlined text-[var(--text-muted)] text-[16px]">history</span><span class="text-sm truncate">${item}</span>`;

        row.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevents input blur from firing before selection
            input.value = item;
            state.filters.searchQuery = item;
            saveSearchQuery(item);

            // Sync all search inputs across pages
            document.querySelectorAll(".search-input").forEach(inp => {
                if (inp !== input) inp.value = item;
            });

            renderGridsFn();
            dropdown.remove();
        });
        dropdown.appendChild(row);
    });

    container.appendChild(dropdown);
}

// Check category matching for single and multiple selections
export function matchCategory(productCategory, selectedCategories, singleCategory) {
    const normProductCat = productCategory.toLowerCase();

    // 1. Check if multiple categories selected in the sidebar
    if (selectedCategories && selectedCategories.length > 0) {
        if (selectedCategories.includes("All")) {
            return true;
        }

        // Map UI category names to matching rules:
        // Apparel -> Fashion
        return selectedCategories.some(cat => {
            const normCat = cat.toLowerCase();
            if (normCat === "apparel" || normCat === "fashion") {
                return normProductCat === "fashion" || normProductCat === "apparel";
            }
            return normProductCat === normCat;
        });
    }

    // 2. Check if a single category is selected via buttons or cards
    if (singleCategory && singleCategory !== "All") {
        const normSingleCat = singleCategory.toLowerCase();
        if (normSingleCat === "apparel" || normSingleCat === "fashion") {
            return normProductCat === "fashion" || normProductCat === "apparel";
        }
        return normProductCat === normSingleCat;
    }

    return true;
}

// Export the filtered products function
export function getFilteredProducts(state) {
    // Determine active categories from checkboxes
    const checkboxes = document.querySelectorAll(".category-btn-checkbox");
    let selectedCategories = [];
    if (checkboxes.length > 0) {
        checkboxes.forEach(cb => {
            if (cb.checked) {
                selectedCategories.push(cb.value);
            }
        });
    }

    // If no checkboxes checked, treat as All
    if (selectedCategories.length === 0) {
        selectedCategories = ["All"];
    }

    return products.filter(prod => {
        // 1. Category filter (supports both multi-select array and single state.filters.category)
        if (!matchCategory(prod.category, selectedCategories, state.filters.category)) {
            return false;
        }

        // 2. Search query filter
        if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase().trim();
            const titleMatch = prod.title.toLowerCase().includes(query);
            const categoryMatch = prod.category.toLowerCase().includes(query);
            const subcategoryMatch = prod.subcategory && prod.subcategory.toLowerCase().includes(query);
            if (!titleMatch && !categoryMatch && !subcategoryMatch) {
                return false;
            }
        }

        // 3. Price range filter
        if (state.activeView === "shop") {
            if (prod.price < state.filters.priceMin || prod.price > state.filters.priceMax) {
                return false;
            }
        } else {
            if (state.filters.priceRange && state.filters.priceRange.length > 0) {
                const inRange = state.filters.priceRange.some(range => {
                    if (range === "0-5000") return prod.price < 5000;
                    if (range === "5000-15000") return prod.price >= 5000 && prod.price <= 15000;
                    if (range === "15000-plus") return prod.price > 15000;
                    return false;
                });
                if (!inRange) return false;
            }
        }

        // 4. Rating filter
        if (state.filters.rating > 0 && prod.rating < state.filters.rating) {
            return false;
        }

        return true;
    });
}

// Export the grid markup renderer
export function renderGridMarkup(items, type) {
    const isShop = type === "shop";
    return items.map(item => {
        const formatPrice = (item.price / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

        let tagHtml = "";
        if (item.rating >= 4.9) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-amber)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">Elite</div>`;
        } else if (item.id % 7 === 0) {
            tagHtml = `<div class="absolute top-unit-2 left-unit-2 bg-[var(--accent-teal)] text-[var(--text-dark)] font-label-md text-[10px] px-unit-2 py-0.5 rounded uppercase font-bold">New</div>`;
        }

        const displayCategory = item.category === "Fashion" ? "Apparel" : item.category;

        if (isShop) {
            return `
        <div class="card-dark group product-card rounded-xl p-unit-4 shadow-sm" 
             data-product-id="${item.id}" 
             data-name="${item.title}" 
             data-price="${item.price}" 
             data-category="${item.category}">
            <div class="aspect-square bg-[var(--bg-card)] rounded-lg mb-unit-4 overflow-hidden relative">
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" />
                ${tagHtml}
                <button class="add-favorite-btn absolute top-unit-2 right-unit-2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">favorite</span>
                </button>
            </div>
            <div class="flex flex-col gap-unit-1">
                <div class="flex items-start justify-between gap-1">
                    <span class="font-label-md text-label-md text-[var(--accent-silver)] uppercase tracking-widest truncate">${displayCategory}</span>
                    <div class="flex items-center gap-[2px] shrink-0">
                        <span class="material-symbols-outlined text-[var(--accent-amber)] text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                        <span class="text-label-md font-bold text-[var(--text-secondary)]">${item.rating.toFixed(1)}</span>
                    </div>
                </div>
                <h3 class="font-headline-md text-headline-md text-[var(--text-primary)] truncate">${item.title}</h3>
                <span class="text-[var(--text-primary)] font-bold text-body-lg">${formatPrice}</span>
                <div class="flex justify-end mt-unit-1">
                    <button class="quick-add-btn mt-unit-2 w-full py-unit-2 rounded-lg font-label-md text-label-md active:scale-95">
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
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" />
                ${tagHtml}
                <button class="add-favorite-btn absolute top-unit-2 right-unit-2 w-8 h-8 bg-[var(--bg-card)]/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">favorite</span>
                </button>
            </div>
            <div class="flex flex-col gap-unit-1">
                <span class="font-label-md text-label-md text-[var(--accent-silver)] uppercase tracking-widest">${displayCategory}</span>
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

// Bind quick-add buttons
export function bindProductCardEvents(productsList, addToCartFn) {
    const cards = document.querySelectorAll(".product-card");
    cards.forEach(card => {
        const addBtn = card.querySelector(".quick-add-btn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const prodId = parseInt(card.dataset.productId, 10);
                const item = productsList.find(p => p.id === prodId);
                if (item && typeof addToCartFn === "function") {
                    addToCartFn(item);
                    if (typeof window.openCartDrawer === "function") {
                        window.openCartDrawer();
                    }
                }
            });
        }
    });
}

// Initialize search input elements and history
export function initSearchAndFilters(state, DOM, renderGridsFn, addToCartFn) {
    // 1. Text Search Input listener
    DOM.searchInputs.forEach(input => {
        const container = input.parentElement;
        if (container) {
            container.style.position = 'relative';
        }

        input.addEventListener('focus', () => {
            renderSearchHistory(container, input, state, renderGridsFn);
        });

        input.addEventListener('blur', () => {
            // Delay dropdown removal slightly to allow row click to fire first if it was a mouseclick
            setTimeout(() => {
                const dropdown = container.querySelector('.search-history-dropdown');
                if (dropdown) dropdown.remove();
            }, 200);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveSearchQuery(e.target.value);
                const dropdown = container.querySelector('.search-history-dropdown');
                if (dropdown) dropdown.remove();
                input.blur();
            }
        });

        input.addEventListener('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                const value = e.target.value;
                state.filters.searchQuery = value;

                // Sync search query in all inputs
                DOM.searchInputs.forEach(inp => {
                    if (inp !== input) inp.value = value;
                });

                renderGridsFn();
            }, 300); // 300ms debounce
        });
    });

    // 2. Sidebar category checkboxes logic
    const checkboxes = document.querySelectorAll(".category-btn-checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
            const value = e.target.value;
            const checked = e.target.checked;

            if (value === "All") {
                if (checked) {
                    // Uncheck all other checkboxes
                    checkboxes.forEach(cb => {
                        if (cb.value !== "All") cb.checked = false;
                    });
                } else {
                    // Must have at least one selected, default back to checking All
                    e.target.checked = true;
                }
            } else {
                if (checked) {
                    // Uncheck the "All Products" checkbox
                    const allCb = Array.from(checkboxes).find(cb => cb.value === "All");
                    if (allCb) allCb.checked = false;
                } else {
                    // Check if any other category is checked. If none, check "All"
                    const anyChecked = Array.from(checkboxes).some(cb => cb.value !== "All" && cb.checked);
                    if (!anyChecked) {
                        const allCb = Array.from(checkboxes).find(cb => cb.value === "All");
                        if (allCb) allCb.checked = true;
                    }
                }
            }

            // Sync with global single category filter label in header if single selection is active
            const activeLabel = document.getElementById("active-category-label");
            if (activeLabel) {
                const activeCbs = Array.from(checkboxes).filter(cb => cb.checked);
                if (activeCbs.length === 1) {
                    activeLabel.textContent = activeCbs[0].value === "All" ? "All Products" : activeCbs[0].value;
                } else if (activeCbs.length > 1) {
                    activeLabel.textContent = "Multiple Categories";
                } else {
                    activeLabel.textContent = "All Products";
                }
            }

            // Sync state category to reflect multi-select category list
            const activeValues = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
            if (activeValues.length === 1 && activeValues[0] === "All") {
                state.filters.category = "All";
            } else {
                // Keep state.filters.category updated if there is a primary single selection, otherwise multiple
                state.filters.category = activeValues.length === 1 ? activeValues[0] : "Multiple";
            }

            renderGridsFn();
        });
    });

    // 3. Listen to single category selections (navbar/hero) and synchronize the checkboxes
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-category]");
        if (target && !target.classList.contains("category-btn-checkbox")) {
            const category = target.getAttribute("data-category");

            // Set single category in state
            state.filters.category = category;

            // Sync checkboxes in sidebar
            checkboxes.forEach(cb => {
                if (category === "All") {
                    cb.checked = (cb.value === "All");
                } else {
                    cb.checked = (cb.value.toLowerCase() === category.toLowerCase() ||
                        (cb.value === "Apparel" && category === "Apparel") ||
                        (cb.value === "Apparel" && category === "Fashion"));
                }
            });

            // Update in-page sticky filter tab label
            const activeLabel = document.getElementById("active-category-label");
            if (activeLabel) {
                activeLabel.textContent = category === "All" ? "All Products" : category;
            }

            renderGridsFn();
        }
    });
}

// ** student 3a end **
