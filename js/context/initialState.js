import { products } from "../data/products.js";
import { filterDefaults } from "../constants/filterDefaults.js";
import { loadCart } from "../utils/localStorage.js";

const loadedCart = loadCart().map(item => {
  const product = products.find(p => p.id === item.id);
  if (product) {
    item.image = product.image;
    item.title = product.title;
    item.price = product.price;
    item.category = product.category;
  }
  return item;
});

/**
 * Initial application state matching the PRD specification.
 */
export const initialState = {
  products: products,
  cart: loadedCart,
  searchQuery: "",
  filters: { ...filterDefaults },
  activeView: "catalog",
  appliedCoupon: null
};

