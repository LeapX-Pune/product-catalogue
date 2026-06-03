/**
 * List of available discount coupons.
 * 
 * Discount types:
 * - "percentage": discountValue is a percentage (0-100)
 * - "fixed": discountValue is a fixed amount subtracted from the total
 */
export const coupons = [
  {
    code: "WELCOME10",
    type: "percentage",
    discountValue: 10,
    description: "10% off your entire order"
  },
  {
    code: "SAVE200",
    type: "fixed",
    discountValue: 200,
    description: "₹200 flat off"
  },
  {
    code: "FASHION15",
    type: "percentage",
    discountValue: 15,
    description: "15% off on Apparel/Fashion"
  },
  {
    code: "ELECTRO10",
    type: "percentage",
    discountValue: 10,
    description: "10% off on Electronics"
  },
  {
    code: "FESTIVE20",
    type: "percentage",
    discountValue: 20,
    description: "20% off Festival Sale"
  },
  {
    code: "FIRSTBUY",
    type: "percentage",
    discountValue: 20, // Assumed 20%
    description: "New User Discount"
  },
  {
    code: "HOME250",
    type: "fixed",
    discountValue: 250,
    description: "₹250 off on Home Products"
  },
  {
    code: "BEAUTY15",
    type: "percentage",
    discountValue: 15,
    description: "15% off on Beauty Products"
  }
];
