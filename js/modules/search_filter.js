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
    dropdown.className = 'search-history-dropdown';

    history.forEach(item => {
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `<span class="material-symbols-outlined text-[var(--text-muted)] text-[16px]">history</span><span>${item}</span>`;

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

// Maps UI category names to product category names they should match
const CATEGORY_ALIASES = {
    "apparel": ["fashion", "apparel"],
    "fashion": ["fashion", "apparel"],
    "fitness": ["sports & fitness", "fitness"],
    "home decor": ["home & kitchen", "decor", "home decor"],
};

function matchesCategory(uiCategory, productCategory) {
    const normProduct = productCategory.toLowerCase();
    const normUI = uiCategory.toLowerCase();
    const aliases = CATEGORY_ALIASES[normUI];
    if (aliases) {
        return aliases.includes(normProduct);
    }
    return normProduct === normUI;
}

// Check category matching for single and multiple selections
export function matchCategory(productCategory, selectedCategories, singleCategory) {
    const normProductCat = productCategory.toLowerCase();

    // 1. Check if multiple categories selected in the sidebar
    if (selectedCategories && selectedCategories.length > 0) {
        if (selectedCategories.includes("All")) {
            return true;
        }
        return selectedCategories.some(cat => matchesCategory(cat, productCategory));
    }

    // 2. Check if a single category is selected via buttons or cards
    if (singleCategory && singleCategory !== "All") {
        return matchesCategory(singleCategory, productCategory);
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

    console.log('[getFilteredProducts] selectedCategories:', selectedCategories, 'activeView:', state.activeView, 'priceMin:', state.filters.priceMin, 'priceMax:', state.filters.priceMax);

    return products.filter(prod => {
        // 1. Category filter (supports both multi-select array and single state.filters.category)
        if (!matchCategory(prod.category, selectedCategories, state.filters.category)) {
            return false;
        }

        // 2. Subcategory filter
        const subFilter = state.filters.subcategory;
        if (subFilter && subFilter !== "All" && subFilter !== "Multiple") {
            if (!prod.subcategory || prod.subcategory !== subFilter) {
                return false;
            }
        }

        // 3. Search query filter
        if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase().trim();
            const titleMatch = prod.title.toLowerCase().includes(query);
            const categoryMatch = prod.category.toLowerCase().includes(query);
            const subcategoryMatch = prod.subcategory && prod.subcategory.toLowerCase().includes(query);
            if (!titleMatch && !categoryMatch && !subcategoryMatch) {
                return false;
            }
        }

        // 4. Price range filter
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

        // 5. Rating filter
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
        const priceNum = item.price;
        const priceFormatted = priceNum.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const dotIdx = priceFormatted.indexOf('.');
        const formatPrice = dotIdx === -1 ? priceFormatted : priceFormatted.slice(0, dotIdx) + '<small class="price-decimal">' + priceFormatted.slice(dotIdx) + '</small>';

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
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" loading="lazy" />
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
                <img alt="${item.title}" class="product-card-img w-full h-full object-cover" src="${item.image}" loading="lazy" />
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

// Helper to render autocomplete suggestions based on product titles
function renderAutocompleteSuggestions(container, input, state, renderGridsFn) {
    // Remove existing autocomplete dropdown
    const existing = container.querySelector('.search-autocomplete-dropdown');
    if (existing) existing.remove();

    const query = input.value.trim().toLowerCase();
    if (!query) return;

    // Find matching product titles (max 8)
    const matches = products
        .filter(p => p.title.toLowerCase().includes(query))
        .slice(0, 8);

    if (matches.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'search-autocomplete-dropdown';
    // Track state for keyboard navigation
    dropdown._highlightIndex = -1;
    dropdown._rows = [];

    matches.forEach(product => {
        const row = document.createElement('div');
        row.className = 'suggestion-row';
        row._product = product;
        // Highlight the matching portion
        const idx = product.title.toLowerCase().indexOf(query);
        let displayTitle = product.title;
        if (idx !== -1) {
            displayTitle = product.title.slice(0, idx) +
                '<strong>' + product.title.slice(idx, idx + query.length) + '</strong>' +
                product.title.slice(idx + query.length);
        }
        row.innerHTML = `<span class="material-symbols-outlined text-[var(--text-muted)] text-[16px]">search</span><span class="suggestion-title">${displayTitle}</span><span class="suggestion-category">${product.category}</span>`;

        row.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = product.title;
            state.filters.searchQuery = product.title;
            saveSearchQuery(product.title);

            DOM.searchInputs.forEach(inp => {
                if (inp !== input) inp.value = product.title;
            });

            renderGridsFn();
            dropdown.remove();
            input.blur();
        });

        row.addEventListener('mouseenter', () => {
            dropdown._rows.forEach(r => r.classList.remove('active'));
            row.classList.add('active');
            dropdown._highlightIndex = dropdown._rows.indexOf(row);
        });

        dropdown._rows.push(row);
        dropdown.appendChild(row);
    });

    container.appendChild(dropdown);
}

// Initialize search input elements and history
export function initSearchAndFilters(state, DOM, renderGridsFn, addToCartFn, updateSubcategoriesFn) {
    // 1. Text Search Input listener
    DOM.searchInputs.forEach(input => {
        const container = input.parentElement;
        if (container) {
            container.style.position = 'relative';
        }

        input.addEventListener('focus', () => {
            if (!input.value.trim()) {
                renderSearchHistory(container, input, state, renderGridsFn);
            } else {
                renderAutocompleteSuggestions(container, input, state, renderGridsFn);
            }
        });

        input.addEventListener('blur', () => {
            // Delay dropdown removal slightly to allow row click to fire first if it was a mouseclick
            setTimeout(() => {
                const historyDropdown = container.querySelector('.search-history-dropdown');
                if (historyDropdown) historyDropdown.remove();
                const autocompleteDropdown = container.querySelector('.search-autocomplete-dropdown');
                if (autocompleteDropdown) autocompleteDropdown.remove();
            }, 200);
        });

        input.addEventListener('keydown', (e) => {
            const autocompleteDropdown = container.querySelector('.search-autocomplete-dropdown');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (autocompleteDropdown && autocompleteDropdown._rows && autocompleteDropdown._rows.length > 0) {
                    autocompleteDropdown._highlightIndex = Math.min(
                        autocompleteDropdown._highlightIndex + 1,
                        autocompleteDropdown._rows.length - 1
                    );
                    autocompleteDropdown._rows.forEach(r => r.classList.remove('active'));
                    const activeRow = autocompleteDropdown._rows[autocompleteDropdown._highlightIndex];
                    activeRow.classList.add('active');
                    activeRow.scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (autocompleteDropdown && autocompleteDropdown._rows && autocompleteDropdown._rows.length > 0) {
                    autocompleteDropdown._highlightIndex = Math.max(
                        autocompleteDropdown._highlightIndex - 1,
                        -1
                    );
                    autocompleteDropdown._rows.forEach(r => r.classList.remove('active'));
                    if (autocompleteDropdown._highlightIndex >= 0) {
                        const activeRow = autocompleteDropdown._rows[autocompleteDropdown._highlightIndex];
                        activeRow.classList.add('active');
                        activeRow.scrollIntoView({ block: 'nearest' });
                    }
                }
            } else if (e.key === 'Enter') {
                if (autocompleteDropdown && autocompleteDropdown._highlightIndex >= 0) {
                    e.preventDefault();
                    const activeRow = autocompleteDropdown._rows[autocompleteDropdown._highlightIndex];
                    const product = activeRow._product;
                    input.value = product.title;
                    state.filters.searchQuery = product.title;
                    saveSearchQuery(product.title);
                    DOM.searchInputs.forEach(inp => {
                        if (inp !== input) inp.value = product.title;
                    });
                    renderGridsFn();
                    autocompleteDropdown.remove();
                    input.blur();
                    return;
                }
                saveSearchQuery(e.target.value);
                const historyDropdown = container.querySelector('.search-history-dropdown');
                if (historyDropdown) historyDropdown.remove();
                if (autocompleteDropdown) autocompleteDropdown.remove();
                input.blur();
            } else if (e.key === 'Escape') {
                if (autocompleteDropdown) {
                    autocompleteDropdown.remove();
                }
                const historyDropdown = container.querySelector('.search-history-dropdown');
                if (historyDropdown) historyDropdown.remove();
            }
        });

        input.addEventListener('input', (e) => {
            const value = e.target.value;

            // Show autocomplete suggestions in real-time
            renderAutocompleteSuggestions(container, input, state, renderGridsFn);

            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
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
                state.filters.category = activeValues.length === 1 ? activeValues[0] : "Multiple";
            }

            // Reset subcategory and update subcategory UI when category changes
            state.filters.subcategory = "All";
            if (typeof updateSubcategoriesFn === "function") {
                updateSubcategoriesFn(state.filters.category);
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
            state.filters.subcategory = "All";

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

            if (typeof updateSubcategoriesFn === "function") {
                updateSubcategoriesFn(category);
            }

            renderGridsFn();
        }
    });
}

// ** student 3a end **
