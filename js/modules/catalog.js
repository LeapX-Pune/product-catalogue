import { products } from "../data/products.js";

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

let searchQuery = "";
let debounceTimer;

// ========================
// RENDER PRODUCTS
// ========================
export function renderProducts(list) {
    grid.innerHTML = "";

    if (!list.length) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    list.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" />
            <h3>${product.title}</h3>
            <p class="category">${product.category}</p>
            <p class="price">₹${product.price}</p>
            <p class="rating">⭐ ${product.rating}</p>
        `;

        grid.appendChild(card);
    });
}

// ========================
// FILTER LOGIC
// ========================
function filterProducts(query) {
    const filtered = products.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );

    renderProducts(filtered);
}

// ========================
// SEARCH HANDLER (DEBOUNCED)
// ========================
function handleSearch(e) {
    searchQuery = e.target.value;

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        filterProducts(searchQuery);
    }, 200); // small performance optimization
}

// ========================
// INIT
// ========================
export function initCatalog() {
    renderProducts(products);
    searchInput.addEventListener("input", handleSearch);
}

// Auto-start
initCatalog();