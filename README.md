#  Product Catalog with Cart & Checkout System

A modern ecommerce-style frontend application where users can browse products, search items, apply filters, manage a shopping cart, use drag-and-drop interactions, and complete a validated checkout flow.

This project is designed to help developers practice real-world frontend development concepts like state management, filtering logic, component communication, form validation, responsive UI design, and drag-and-drop functionality.

---

# Project Objective

Build a responsive and interactive product catalog application that simulates a real online shopping experience.

Users should be able to:

* Browse products visually
* Search products instantly
* Filter products using multiple conditions
* Add/remove items from cart
* Update cart quantities
* Drag products into cart
* Complete checkout with form validation

---

#  Features

##  Product Catalog

* Responsive product grid layout
* Product cards displaying:

  * Image
  * Title
  * Category
  * Price
  * Rating
* Optional product detail modal/page

---

##  Search Functionality

* Real-time product search
* Keyword-based filtering
* Instant UI updates while typing

---

##  Filtering System

Users can filter products by:

* Category
* Price Range
* Ratings

Supports:

* Multiple filters together
* Dynamic filtered results

---

##  Shopping Cart

* Add products to cart
* Remove products from cart
* Increase/decrease quantity
* Auto-update total price
* Display cart item count
* Empty cart handling

---

##  Drag and Drop

* Drag product cards into cart
* Visual feedback during drag
* Instant cart updates after drop

---

##  Checkout System

Validated checkout form including:

* Full Name
* Email Address
* Phone Number
* Shipping Address
* City
* Pincode
* Payment Method

Validation includes:

* Required fields
* Email format checking
* Numeric validation
* Inline error messages
* Prevent invalid submission

---

#  Responsive Design

Application is optimized for:

* Desktop
* Tablet
* Mobile Devices

Responsive features include:

* Adaptive grid layouts
* Mobile-friendly cart
* Flexible filter section

---

#  Frontend Concepts Practiced

* State Management
* Array Filtering
* Controlled Components
* Form Validation
* Drag and Drop API
* Conditional Rendering
* Local Storage
* Responsive UI Design
* Component Communication

---

#  Recommended Tech Stack

## Core

* HTML
* CSS
* JavaScript

## Optional Modern Stack

* React
* Tailwind CSS
* Context API / Redux

---

#  Suggested Project Structure

```bash
src/
│
├── components/
│   ├── Header
│   ├── SearchBar
│   ├── Filters
│   ├── ProductList
│   ├── ProductCard
│   ├── Cart
│   ├── CartItem
│   └── CheckoutForm
│
├── data/
│   └── products.js
│
├── styles/
│   └── global.css
│
├── App.js
└── main.js
```

---

#  Sample Product Data

```js
{
  id: 1,
  title: "Wireless Headphones",
  category: "Electronics",
  price: 2999,
  rating: 4.5,
  image: "image-url"
}
```

---

#  Functional Requirements

| ID    | Requirement                | Priority     |
| ----- | -------------------------- | ------------ |
| FR-1  | Product catalog rendering  | MUST HAVE    |
| FR-2  | Product search             | MUST HAVE    |
| FR-3  | Category filter            | MUST HAVE    |
| FR-4  | Price range filter         | MUST HAVE    |
| FR-5  | Rating filter              | MUST HAVE    |
| FR-6  | Multiple filters together  | MUST HAVE    |
| FR-7  | Add to cart button         | MUST HAVE    |
| FR-8  | Drag-and-drop cart         | MUST HAVE    |
| FR-9  | Cart totals                | MUST HAVE    |
| FR-10 | Quantity controls          | MUST HAVE    |
| FR-11 | Checkout form validation   | MUST HAVE    |
| FR-12 | Validation error handling  | MUST HAVE    |
| FR-13 | Responsive design          | MUST HAVE    |
| FR-14 | Local Storage persistence  | GOOD TO HAVE |
| FR-15 | Animations and transitions | GOOD TO HAVE |

---

#  Error Handling

| Scenario                  | Expected Behaviour        |
| ------------------------- | ------------------------- |
| Empty search results      | Show “No products found”  |
| Empty cart                | Show empty cart message   |
| Invalid form input        | Inline validation message |
| Checkout without products | Prevent submission        |

---

#  Future Improvements

Future features that can be added later:

* Wishlist
* Product details page
* Authentication
* Payment gateway integration
* Coupons and discounts
* Backend API
* Order history
* Product sorting

---


#  Expected UI Sections

* Header/Navbar
* Search Bar
* Filter Sidebar
* Product Grid
* Shopping Cart
* Checkout Form
* Success/Error Messages

---





