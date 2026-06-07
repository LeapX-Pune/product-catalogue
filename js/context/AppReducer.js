import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_QUANTITY,
  CLEAR_CART,
  SET_SEARCH_QUERY,
  SET_FILTERS,
  TOGGLE_VIEW,
  APPLY_COUPON,
  REMOVE_COUPON
} from "./actionTypes.js";

/**
 * Reducer function managing the global product catalogue state.
 * 
 * @param {Object} state - Current global state.
 * @param {Object} action - Action object containing type and payload.
 * @returns {Object} The next state.
 */
export function AppReducer(state, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      const productId = action.payload;
      const existingCartItem = state.cart.find((item) => item.id === productId);

      if (existingCartItem) {
        // Product already in cart, increment quantity
        const updatedCart = state.cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          cart: updatedCart
        };
      }

      // Product not in cart, find it in products list
      const product = state.products.find((p) => p.id === productId);
      if (!product) {
        console.warn(`Product with ID ${productId} not found in products list.`);
        return state;
      }

      // Add to cart with quantity 1 (matching Cart Item Shape)
      const newCartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        image: product.image,
        category: product.category
      };

      return {
        ...state,
        cart: [...state.cart, newCartItem]
      };
    }

    case REMOVE_FROM_CART: {
      const productId = action.payload;
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== productId)
      };
    }

    case UPDATE_QUANTITY: {
      const { id, type } = action.payload; // type: "increment" | "decrement"
      
      const updatedCart = state.cart
        .map((item) => {
          if (item.id === id) {
            const nextQuantity =
              type === "increment" ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: nextQuantity };
          }
          return item;
        })
        // quantity cannot go below 0; if quantity becomes 0, remove item from cart
        .filter((item) => item.quantity > 0);

      return {
        ...state,
        cart: updatedCart
      };
    }

    case CLEAR_CART: {
      return {
        ...state,
        cart: [],
        appliedCoupon: null
      };
    }

    case SET_SEARCH_QUERY: {
      return {
        ...state,
        searchQuery: action.payload ?? ""
      };
    }

    case SET_FILTERS: {
      // Merge new filters with current filters to support multi-filtering together
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    }

    case TOGGLE_VIEW: {
      const view = action.payload; // "catalog" | "checkout"
      if (view !== "catalog" && view !== "checkout") {
        console.warn(`Unknown view: ${view}. Defaulting to catalog.`);
        return {
          ...state,
          activeView: "catalog"
        };
      }
      return {
        ...state,
        activeView: view
      };
    }

    case APPLY_COUPON: {
      return {
        ...state,
        appliedCoupon: action.payload
      };
    }

    case REMOVE_COUPON: {
      return {
        ...state,
        appliedCoupon: null
      };
    }

    default:
      return state;
  }
}
