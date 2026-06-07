/**
 * STALE — This module is NOT imported by index.html or script.js.
 * The active checkout flow is implemented directly in js/script.js
 * with the markup in index.html (shipping-form, payment-form).
 * Keep this file only as a reference; do not wire it in without
 * reconciling against the active flow.
 */

import {
    validateFullName,
    validateEmail,
    validatePhone,
    validateStreet,
    validateCity,
    validatePincode,
    validatePayment,
    validateForm
} from '../utils/checkout_validator.js';

function showError(fieldId, message) {
    const el = document.getElementById(`${fieldId}-error`);
    if (el) el.textContent = message;
}

function clearError(fieldId) {
    const el = document.getElementById(`${fieldId}-error`);
    if (el) el.textContent = '';
}

function getFormData(form) {
    const payment = form.querySelector('input[name="payment"]:checked');
    return {
        fullName: form.fullName.value.trim(),
        email:    form.email.value.trim(),
        phone:    form.phone.value.trim(),
        street:   form.street.value.trim(),
        city:     form.city.value.trim(),
        pincode:  form.pincode.value.trim(),
        payment:  payment ? payment.value : null,
    };
}

function updateSubmitButton() {
    const form = document.getElementById('checkout-form');
    const btn  = document.getElementById('checkout-btn');
    if (!form || !btn) return;

    const data = getFormData(form);
    const { isValid } = validateForm(data);

    btn.disabled = !isValid;
    btn.style.backgroundColor = isValid ? '#1a1a2e' : '#cccccc';
    btn.style.color            = isValid ? '#ffffff' : '#888888';
    btn.style.cursor           = isValid ? 'pointer' : 'not-allowed';

    if (isValid && !form.dataset.autoSubmitted) {
        form.dataset.autoSubmitted = 'true';
        setTimeout(() => form.requestSubmit(), 500);
    }
}

function luhn(num) {
    const digits = num.replace(/\D/g, '').split('').reverse();
    let sum = 0;
    digits.forEach((d, i) => {
        let n = parseInt(d);
        if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
    });
    return sum % 10 === 0;
}

function detectCard(num) {
    if (/^4/.test(num))                                               return { type: 'visa',       label: 'Visa',       maxLen: 16 };
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num))                  return { type: 'mastercard', label: 'Mastercard', maxLen: 16 };
    if (/^3[47]/.test(num))                                           return { type: 'amex',       label: 'Amex',       maxLen: 15 };
    return null;
}

function attachBlurListeners(section) {
    const fields = [
        { id: 'fullName', validator: validateFullName },
        { id: 'email',    validator: validateEmail    },
        { id: 'phone',    validator: validatePhone    },
        { id: 'street',   validator: validateStreet   },
        { id: 'city',     validator: validateCity     },
        { id: 'pincode',  validator: validatePincode  },
    ];

    fields.forEach(({ id, validator }) => {
        const input = section.querySelector(`#${id}`);
        if (!input) return;
        input.addEventListener('blur', () => {
            const result = validator(input.value);
            result.valid ? clearError(id) : showError(id, result.message);
            updateSubmitButton();
        });
    });

    // Payment radios — show/hide UPI or card panels
    section.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const cardDetails = section.querySelector('#card-details');
            const upiDetails  = section.querySelector('#upi-details');
            cardDetails.style.display = radio.value === 'card' ? 'block' : 'none';
            upiDetails.style.display  = radio.value === 'upi'  ? 'block' : 'none';

            if (radio.value !== 'card') {
                ['cardNum', 'cardName', 'cardExpiry', 'cardCvv'].forEach(clearError);
            }
            if (radio.value !== 'upi') clearError('upiId');
            clearError('payment');
            updateSubmitButton();
        });
    });

    // Card number — live detection + Luhn feedback
    const cardInput = section.querySelector('#cardNum');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            const raw    = e.target.value.replace(/\D/g, '');
            const card   = detectCard(raw);
            const maxLen = card ? card.maxLen : 16;
            const trimmed = raw.slice(0, maxLen);

            // Format: 4-4-4-4 (Amex stays as-is visually; trimmed to 15)
            e.target.value = trimmed.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

            const el = document.getElementById('cardNum-error');
            if (!card) {
                if (el) el.style.color = '#cc0000';
                showError('cardNum', trimmed.length > 0 ? 'Unknown card — enter Visa, Mastercard, or Amex' : '');
                return;
            }
            if (trimmed.length === maxLen) {
                if (luhn(trimmed)) {
                    if (el) { el.style.color = '#4caf50'; el.textContent = `✓ Valid ${card.label} card`; }
                } else {
                    if (el) el.style.color = '#cc0000';
                    showError('cardNum', `Invalid ${card.label} number`);
                }
            } else {
                if (el) { el.style.color = '#888888'; el.textContent = `${card.label} detected — keep typing`; }
            }
        });
    }

    // Card expiry — auto-format MM/YY + expiry check
    const expiryInput = section.querySelector('#cardExpiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
            e.target.value = val;

            if (val.length === 5) {
                const [mm, yy] = val.split('/').map(Number);
                const now      = new Date();
                const expYear  = 2000 + yy;
                if (mm < 1 || mm > 12) {
                    showError('cardExpiry', 'Invalid month');
                } else if (expYear > now.getFullYear() + 20) {
                    showError('cardExpiry', 'Invalid expiry year');
                } else if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
                    showError('cardExpiry', 'Card has expired');
                } else {
                    clearError('cardExpiry');
                }
            } else {
                clearError('cardExpiry');
            }
        });
    }

    // CVV — digits only, length tied to card type
    const cvvInput = section.querySelector('#cardCvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
        });
        cvvInput.addEventListener('blur', () => {
            const val         = cvvInput.value;
            const cardRaw     = section.querySelector('#cardNum')?.value.replace(/\D/g, '') || '';
            const expectedLen = detectCard(cardRaw)?.type === 'amex' ? 4 : 3;
            if (!val)                      showError('cardCvv', 'CVV is required');
            else if (val.length !== expectedLen) showError('cardCvv', `CVV must be ${expectedLen} digits`);
            else                           clearError('cardCvv');
        });
    }

    // UPI ID — blur validation
    const upiInput = section.querySelector('#upiId');
    if (upiInput) {
        upiInput.addEventListener('blur', () => {
            const val      = upiInput.value.trim();
            const upiRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z][a-zA-Z0-9]{2,}$/;
            if (!val)                    showError('upiId', 'UPI ID is required');
            else if (!upiRegex.test(val)) showError('upiId', 'Enter a valid UPI ID (e.g. name@upi)');
            else                         clearError('upiId');
        });
    }
}

function attachSubmitHandler(section) {
    const form = section.querySelector('#checkout-form');

    // ── Edit cart button (top summary bar) ──────────────────────────────────
    const editCartBtn = section.querySelector('.edit-cart-btn');
    if (editCartBtn) {
        editCartBtn.addEventListener('click', () => {
            // Use the app's openCartDrawer if available (wired in script.js)
            if (typeof window.openCartDrawer === 'function') {
                window.openCartDrawer();
                return;
            }
            // Fallback: dispatch a custom event the parent app can listen to
            window.dispatchEvent(new CustomEvent('checkout:editCart'));
        });
    }

    // ── Back to Cart button (bottom actions row) ─────────────────────────────
    const backBtn = section.querySelector('#back-to-cart-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (typeof window.openCartDrawer === 'function') {
                window.openCartDrawer();
                return;
            }
            if (typeof window.showCart === 'function') {
                window.showCart();
                return;
            }
            window.dispatchEvent(new CustomEvent('checkout:editCart'));
        });
    }

    // ── Form submit ──────────────────────────────────────────────────────────
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Cart empty guard — reads from app state if available
        const cart = (typeof window.getCart === 'function' ? window.getCart() : null)
                     || window.cart
                     || ['item1'];
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }

        const data = getFormData(form);
        const { isValid, results } = validateForm(data);

        Object.entries(results).forEach(([field, result]) => {
            result.valid ? clearError(field) : showError(field, result.message);
        });

        if (!isValid) return;

        // Extra validation — card fields
        if (data.payment === 'card') {
            const cardRaw    = form.querySelector('#cardNum').value.replace(/\D/g, '');
            const card       = detectCard(cardRaw);
            const cardNameVal = form.querySelector('#cardName').value.trim();
            const expiryVal  = form.querySelector('#cardExpiry').value.trim();
            const cvvVal     = form.querySelector('#cardCvv').value.trim();
            const expectedCvv = card?.type === 'amex' ? 4 : 3;
            let cardValid = true;

            if (!card || cardRaw.length !== card.maxLen || !luhn(cardRaw)) {
                showError('cardNum', 'Please enter a valid card number');
                cardValid = false;
            }
            if (!cardNameVal) {
                showError('cardName', 'Cardholder name is required');
                cardValid = false;
            }
            if (expiryVal.length !== 5) {
                showError('cardExpiry', 'Enter expiry date as MM/YY');
                cardValid = false;
            }
            if (!cvvVal || cvvVal.length !== expectedCvv) {
                showError('cardCvv', `Enter a valid ${expectedCvv}-digit CVV`);
                cardValid = false;
            }
            if (!cardValid) return;
        }

        // Extra validation — UPI fields
        if (data.payment === 'upi') {
            const upiVal   = form.querySelector('#upiId').value.trim();
            const upiRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z][a-zA-Z0-9]{2,}$/;
            if (!upiVal || !upiRegex.test(upiVal)) {
                showError('upiId', 'Enter a valid UPI ID (e.g. name@upi)');
                return;
            }
        }

        // Success — show modal and clear cart
        section.querySelector('#confirm-modal').style.display = 'flex';
        if (typeof window.clearCart === 'function') window.clearCart();
    });

    // ── Modal close ──────────────────────────────────────────────────────────
    section.querySelector('#modal-close').addEventListener('click', () => {
        section.querySelector('#confirm-modal').style.display  = 'none';
        section.querySelector('#card-details').style.display   = 'none';
        section.querySelector('#upi-details').style.display    = 'none';
        const cardErr = document.getElementById('cardNum-error');
        if (cardErr) { cardErr.textContent = ''; cardErr.style.color = '#cc0000'; }
        form.reset();
        delete form.dataset.autoSubmitted;
        updateSubmitButton();

        // Navigate back to shop after successful order
        if (typeof window.switchView === 'function') window.switchView('shop');
    });
}

function createCheckoutForm() {
    const section = document.createElement('section');
    section.id = 'checkout-section';
    section.innerHTML = `
<div class="checkout-wrapper">
  <div class="progress-steps">
    <div class="step-item"><div class="step-circle done">&#10003;</div><span class="step-label done">Cart</span></div>
    <div class="step-line done"></div>
    <div class="step-item"><div class="step-circle active">2</div><span class="step-label active">Delivery</span></div>
    <div class="step-line"></div>
    <div class="step-item"><div class="step-circle">3</div><span class="step-label">Complete</span></div>
  </div>

  <div class="order-summary-bar">
    <div class="order-summary-left">
      <span class="order-item-count">3 items in cart</span>
      <span class="order-total">&#8377;1,200</span>
    </div>
    <button type="button" class="edit-cart-btn">Edit cart</button>
  </div>

  <form id="checkout-form" novalidate>
    <fieldset>
      <legend>Personal information</legend>
      <div class="form-group">
        <label for="fullName">Full name</label>
        <input type="text" id="fullName" name="fullName" placeholder="Neha Sharma" autocomplete="name" aria-describedby="fullName-error" aria-required="true" />
        <span class="error-msg" id="fullName-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="email">Email address</label>
        <input type="email" id="email" name="email" placeholder="neha@example.com" autocomplete="email" aria-describedby="email-error" aria-required="true" />
        <span class="error-msg" id="email-error" role="alert"></span>
      </div>
      <div class="form-group">
        <label for="phone">Phone number</label>
        <input type="tel" id="phone" name="phone" placeholder="9876543210" maxlength="10" autocomplete="tel" aria-describedby="phone-error" aria-required="true" />
        <span class="error-msg" id="phone-error" role="alert"></span>
      </div>
    </fieldset>

    <fieldset>
      <legend>Delivery address</legend>
      <div class="form-group">
        <label for="street">Street address</label>
        <input type="text" id="street" name="street" placeholder="123 MG Road, Apt 4B" autocomplete="street-address" aria-describedby="street-error" aria-required="true" />
        <span class="error-msg" id="street-error" role="alert"></span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="city">City</label>
          <input type="text" id="city" name="city" placeholder="Pune" autocomplete="address-level2" aria-describedby="city-error" aria-required="true" />
          <span class="error-msg" id="city-error" role="alert"></span>
        </div>
        <div class="form-group">
          <label for="pincode">Pincode</label>
          <input type="text" id="pincode" name="pincode" placeholder="411001" maxlength="6" autocomplete="postal-code" aria-describedby="pincode-error" aria-required="true" />
          <span class="error-msg" id="pincode-error" role="alert"></span>
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Payment method</legend>
      <div class="form-group payment-options">
        <label><input type="radio" name="payment" value="upi"  /> UPI</label>
        <label><input type="radio" name="payment" value="card" /> Credit / Debit card</label>
        <label><input type="radio" name="payment" value="cod"  /> Cash on delivery</label>
      </div>

      <div id="upi-details" style="display:none; margin-top:12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label for="upiId">UPI ID</label>
          <input type="text" id="upiId" name="upiId" placeholder="yourname@upi" autocomplete="off" aria-describedby="upiId-error" />
          <span class="error-msg" id="upiId-error" role="alert"></span>
        </div>
      </div>

      <div id="card-details" style="display:none; margin-top:12px;">
        <div class="form-group">
          <label for="cardNum">Card number</label>
          <input type="text" id="cardNum" name="cardNum" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric" autocomplete="cc-number" aria-describedby="cardNum-error" />
          <span class="error-msg" id="cardNum-error" role="alert"></span>
        </div>
        <div class="form-group">
          <label for="cardName">Cardholder name</label>
          <input type="text" id="cardName" name="cardName" placeholder="Name as on card" autocomplete="cc-name" aria-describedby="cardName-error" />
          <span class="error-msg" id="cardName-error" role="alert"></span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="cardExpiry">Expiry date</label>
            <input type="text" id="cardExpiry" name="cardExpiry" placeholder="MM/YY" maxlength="5" inputmode="numeric" autocomplete="cc-exp" aria-describedby="cardExpiry-error" />
            <span class="error-msg" id="cardExpiry-error" role="alert"></span>
          </div>
          <div class="form-group">
            <label for="cardCvv">CVV</label>
            <input type="password" id="cardCvv" name="cardCvv" placeholder="•••" maxlength="4" inputmode="numeric" autocomplete="cc-csc" aria-describedby="cardCvv-error" />
            <span class="error-msg" id="cardCvv-error" role="alert"></span>
          </div>
        </div>
      </div>
      <span class="error-msg" id="payment-error" role="alert"></span>
    </fieldset>

    <div class="checkout-actions">
      <button type="button" id="back-to-cart-btn">&#8592; Back to Cart</button>
      <button type="submit" id="checkout-btn" disabled>Place Order</button>
    </div>
  </form>

  <div id="confirm-modal" style="display:none;">
    <div class="modal-box">
      <h2>Order placed!</h2>
      <p>Thank you. Your order has been confirmed.</p>
      <button id="modal-close">Back to shop</button>
    </div>
  </div>
</div>`;

    attachBlurListeners(section);
    attachSubmitHandler(section);
    return section;
}

export { createCheckoutForm };
