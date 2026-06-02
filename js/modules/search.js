import { products } from "../data/products.js";
import { renderProducts } from "./catalog.js";

const searchInput = document.getElementById("searchInput");
const searchHistoryDiv = document.getElementById("searchHistory");

let debounceTimer;

let searchHistory =
    JSON.parse(localStorage.getItem("searchHistory")) || [];

function updateHistory(query) {

    if (!query.trim()) return;

    searchHistory = searchHistory.filter(
        item => item !== query
    );

    searchHistory.unshift(query);

    searchHistory = searchHistory.slice(0, 3);

    localStorage.setItem(
        "searchHistory",
        JSON.stringify(searchHistory)
    );

    renderHistory();
}

function renderHistory() {

    searchHistoryDiv.innerHTML = "";

    searchHistory.forEach(item => {

        const btn = document.createElement("button");

        btn.textContent = item;

        btn.className = "history-item";

        btn.addEventListener("click", () => {

            searchInput.value = item;

            performSearch(item);
        });

        searchHistoryDiv.appendChild(btn);
    });
}

function performSearch(query) {

    const filteredProducts = products.filter(product =>
        product.title
            .toLowerCase()
            .includes(query.toLowerCase())
    );

    renderProducts(filteredProducts);
}

searchInput.addEventListener("input", e => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        const query = e.target.value;

        performSearch(query);

        updateHistory(query);

    }, 300);
});

renderHistory();