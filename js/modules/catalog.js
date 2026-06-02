import { products } from "../data/products.js";

const productGrid = document.getElementById("productGrid");
const noResults = document.getElementById("noResults");

export function renderProducts(productList = products) {

    productGrid.innerHTML = "";

    if (productList.length === 0) {

        noResults.classList.remove("hidden");
        return;
    }

    noResults.classList.add("hidden");

    productList.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";

        card.dataset.productId = product.id;

        card.innerHTML = `
            <img
                src="${product.image}"
                alt="${product.title}"
                class="product-image"
            />

            <h3>${product.title}</h3>

            <span class="category-badge">
                ${product.category}
            </span>

            <p class="price">
                ₹${product.price.toLocaleString()}
            </p>

            <p class="rating">
                ⭐ ${product.rating}
            </p>
        `;

        productGrid.appendChild(card);
    });
}