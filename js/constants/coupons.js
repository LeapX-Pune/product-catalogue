/**
 * List of available discount coupons.
 * 
 * Discount types:
 * - "percentage": discountValue is a percentage (0-100)
 * - "fixed": discountValue is a fixed amount subtracted from the total
 */
export const coupons = [
  {
    code: "SAVE10",
    type: "percentage",
    discountValue: 10,
    description: "10% off your entire order"
  },
  {
    code: "SAVE20",
    type: "percentage",
    discountValue: 20,
    description: "20% off your entire order"
  },
  {
    code: "MINUS500",
    type: "fixed",
    discountValue: 500,
    description: "₹500 off on your order"
  },
  {
    code: "FESTIVAL50",
    type: "percentage",
    discountValue: 50,
    description: "50% off holiday special"
  }
];
