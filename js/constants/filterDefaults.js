import { products } from "../data/products.js";

/**
 * Default filter values for the product catalog.
 * Reusable for initializing and resetting filter states.
 */
export const filterDefaults = {
  category: "All", // "All" represents no category filter applied
  maxPrice: Math.max(...products.map(product => product.price)), // Dynamically set to the highest product price
  rating: 0 
};
