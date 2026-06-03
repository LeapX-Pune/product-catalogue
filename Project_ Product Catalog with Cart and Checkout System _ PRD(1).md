# **Product Requirements Document (PRD)**

## Project: Product Catalog with Cart and Checkout System

# Objective

Build a modern product catalog application where users can browse products, search for items, apply filters, add products to a cart, and complete checkout using a validated form.

The goal of this project is to help learners practice building real-world frontend features commonly found in ecommerce applications. The project focuses heavily on UI interactions, state management, form validation, filtering logic, and drag-and-drop experiences.

This project should help learners understand how multiple frontend concepts work together in one connected application.

# Background

Most learners build small isolated frontend exercises but struggle when combining multiple features into a complete application experience.

This project simulates a real ecommerce storefront where users can:

* Browse products visually  
* Search for products quickly  
* Filter products using multiple conditions  
* Manage a shopping cart  
* Complete a checkout flow  
* Interact using drag-and-drop functionality

The project is designed to improve frontend architecture thinking and component communication skills.

# Assumptions

* Product data can be stored locally using JSON or JavaScript arrays  
* No backend implementation is required  
* Checkout submission does not require real payment integration  
* Cart data may optionally persist using Local Storage  
* Images can use placeholder URLs

# Success Metrics / KPIs

### Primary Success Metrics

* Users can successfully search products  
* Users can apply multiple filters together  
* Users can add and remove products from cart  
* Drag-and-drop interaction works correctly  
* Checkout form validation prevents invalid submissions

### Secondary Success Metrics

* Smooth UI interactions  
* Responsive layout across devices  
* Clear error handling and validation messages  
* Proper state synchronization between catalog and cart

# User Persona

### Primary Persona

A user browsing an online shopping website looking for products based on price, category, and ratings.

### Secondary Persona

A first-time shopper who wants a simple and smooth checkout experience.

# User Stories

### Catalog Browsing

* As a user, I should be able to see a grid/list of products  
* As a user, I should be able to see product image, title, price, category, and rating  
* As a user, I should be able to open product details if needed

### Search

* As a user, I should be able to search products using keywords  
* As a user, search results should update quickly while typing

### Filters

* As a user, I should be able to filter products by category  
* As a user, I should be able to filter products by price range  
* As a user, I should be able to filter products by ratings  
* As a user, I should be able to combine multiple filters together

### Cart

* As a user, I should be able to add products to cart  
* As a user, I should be able to remove products from cart  
* As a user, I should be able to increase or decrease quantities  
* As a user, I should be able to see total cart value

### Drag and Drop

* As a user, I should be able to drag a product card into the cart area  
* As a user, I should receive visual feedback while dragging  
* As a user, the cart should update immediately after dropping a product

### Checkout

* As a user, I should be able to fill a checkout form  
* As a user, invalid form fields should show proper error messages  
* As a user, I should not be allowed to submit incomplete data  
* As a user, I should receive a success message after valid submission

# Functional Requirements

| ID | Requirement | Priority |
| :---- | :---- | :---- |
| FR-1 | Display product catalog using cards or grid layout | MUST HAVE |
| FR-2 | Implement product search using text input | MUST HAVE |
| FR-3 | Implement category filter | MUST HAVE |
| FR-4 | Implement price range filter | MUST HAVE |
| FR-5 | Implement rating filter | MUST HAVE |
| FR-6 | Allow multiple filters together | MUST HAVE |
| FR-7 | Add products to cart using button click | MUST HAVE |
| FR-8 | Add products to cart using drag-and-drop | MUST HAVE |
| FR-9 | Display cart item count and total amount | MUST HAVE |
| FR-10 | Allow quantity increment/decrement | MUST HAVE |
| FR-11 | Build checkout form with validations | MUST HAVE |
| FR-12 | Show validation errors clearly | MUST HAVE |
| FR-13 | Make application responsive | MUST HAVE |
| FR-14 | Persist cart using Local Storage | GOOD TO HAVE |
| FR-15 | Add animations/transitions | GOOD TO HAVE |

# Suggested Product Fields

Each product should contain:

```javascript
{
  id: 1,
  title: "Wireless Headphones",
  category: "Electronics",
  price: 2999,
  rating: 4.5,
  image: "image-url"
}
```

# Suggested Checkout Fields

The checkout form should include:

* Full Name  
* Email Address  
* Phone Number  
* Shipping Address  
* City  
* Pincode  
* Payment Method

# Validation Requirements

| Field | Validation |
| :---- | :---- |
| Full Name | Required, minimum 3 characters |
| Email | Must be valid email format |
| Phone | Must contain valid digits |
| Address | Cannot be empty |
| Pincode | Must contain valid numeric value |

# UI Requirements

### Product Catalog Section

* Responsive grid layout  
* Product cards with shadows and spacing  
* Search bar at top  
* Filter sidebar or top filter bar

### Cart Section

* Sticky cart area preferred  
* Quantity controls  
* Total amount section  
* Checkout button

### Drag and Drop

* Highlight cart while dragging  
* Smooth drag feedback  
* Prevent accidental duplicate additions if needed

### Checkout Section

* Clean form layout  
* Inline validation messages  
* Success confirmation modal or message

# Suggested Component Structure

```
App
 ├── Header
 ├── SearchBar
 ├── Filters
 ├── ProductList
 │     └── ProductCard
 ├── Cart
 │     └── CartItem
 └── CheckoutForm
```

# Suggested Frontend Concepts to Practice

* State management  
* Array filtering  
* Controlled forms  
* Form validation  
* Drag and Drop API  
* Conditional rendering  
* Component communication  
* Local Storage  
* Responsive layouts

# Non-Functional Requirements

| Requirement | Details |
| :---- | :---- |
| Performance | Filtering and searching should feel instant |
| Responsiveness | Must work across desktop, tablet, and mobile |
| Accessibility | Buttons and forms should be keyboard accessible |
| Maintainability | Components should remain modular and reusable |

# Error State Handling

| Scenario | Expected Behaviour |
| :---- | :---- |
| Empty search result | Show “No products found” |
| Empty cart | Show empty cart message |
| Invalid form field | Show inline validation message |
| Checkout without products | Prevent submission |

# Future Scope

These features are intentionally out of scope but can be added later:

* Wishlist functionality  
* Product detail pages  
* Real payment gateway  
* User authentication  
* Order history  
* Product sorting  
* Coupons and discounts  
* Backend API integration

# Deliverables

Learners should submit:

* Complete frontend source code  
* Responsive UI  
* Functional drag-and-drop cart  
* Working filters and search  
* Validated checkout form

# Recommended Tech Stack

* HTML  
* CSS  
* JavaScript

Optional:

* React  
* Tailwind CSS  
* Context API or Redux for state management

# Evaluation Checklist

| Feature | Expected |
| :---- | :---- |
| Product rendering | Working correctly |
| Search | Real-time filtering |
| Filters | Multiple filters working together |
| Cart | Add/remove/update working |
| Drag-and-drop | Functional |
| Checkout form | Validation implemented |
| Responsiveness | Properly adapted layout |
| Code quality | Clean and modular structure |

