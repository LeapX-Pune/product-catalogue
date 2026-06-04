// ==========================================
//  Individual Validators
// ==========================================

function validateFullName(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'Full name is required' };
    }
    if (value.trim().length < 3) {
        return { valid: false, message: 'Name must be at least 3 characters' };
    }
    return { valid: true, message: '' };
}

function validateEmail(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'Email address is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
        return { valid: false, message: 'Enter a valid email address' };
    }
    return { valid: true, message: '' };
}

function validatePhone(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'Phone number is required' };
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(value.trim())) {
        return { valid: false, message: 'Phone must be 10 digits, numbers only' };
    }
    return { valid: true, message: '' };
}

function validateStreet(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'Street address is required' };
    }
    return { valid: true, message: '' };
}

function validateCity(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'City is required' };
    }
    return { valid: true, message: '' };
}

function validatePincode(value) {
    if (value.trim().length === 0) {
        return { valid: false, message: 'Pincode is required' };
    }
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(value.trim())) {
        return { valid: false, message: 'Pincode must be 6 digits, numbers only' };
    }
    return { valid: true, message: '' };
}

function validatePayment(value) {
    if (!value) {
        return { valid: false, message: 'Please select a payment method' };
    }
    return { valid: true, message: '' };
}

// ==========================================
//  Master Validator
// ==========================================

function validateForm(formData) {
    const results = {
        fullName : validateFullName(formData.fullName),
        email    : validateEmail(formData.email),
        phone    : validatePhone(formData.phone),
        street   : validateStreet(formData.street),
        city     : validateCity(formData.city),
        pincode  : validatePincode(formData.pincode),
        payment  : validatePayment(formData.payment),
    };
    const isValid = Object.values(results).every(field => field.valid);
    return { isValid, results };
}

// ==========================================
//  Exports
// ==========================================

export {
    validateFullName,
    validateEmail,
    validatePhone,
    validateStreet,
    validateCity,
    validatePincode,
    validatePayment,
    validateForm,
};
