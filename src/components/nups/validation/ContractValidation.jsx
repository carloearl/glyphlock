/**
 * ContractValidation — Validation rules and guardrails for Dream Palace contracts
 * Enforces data integrity, payment limits, and fraud prevention
 */

export const VALIDATION_RULES = {
  // Customer Info
  CUSTOMER_NAME_MIN_LENGTH: 2,
  CUSTOMER_NAME_MAX_LENGTH: 100,
  CUSTOMER_ID_PATTERN: /^[A-Z0-9]{5,20}$/i,
  
  // Payment Limits
  MIN_DREAM_DOLLAR_PURCHASE: 10,
  MAX_DREAM_DOLLAR_PURCHASE: 5000,
  SURCHARGE_RATE: 0.30,
  
  // Card Info
  CARD_LAST_SIX_LENGTH: 6,
  CARD_EXP_PATTERN: /^(0[1-9]|1[0-2])\/\d{2}$/,
  
  // Biometrics
  MAX_IMAGE_SIZE_MB: 5,
  REQUIRED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Contract Execution
  MIN_SIGNATURE_LENGTH: 2,
  CONTRACT_TIMEOUT_MINUTES: 30,
  
  // Rate Limiting
  MAX_CONTRACTS_PER_HOUR_PER_STAFF: 5,
  MAX_CONTRACTS_PER_DAY_PER_CUSTOMER: 3,
};

export class ContractValidator {
  constructor() {
    this.errors = [];
  }

  validateCustomerInfo(data) {
    const { customerName, customerId } = data;
    
    if (!customerName || customerName.trim().length < VALIDATION_RULES.CUSTOMER_NAME_MIN_LENGTH) {
      this.errors.push({
        field: 'customerName',
        message: 'Customer name required (min 2 characters)',
        severity: 'error'
      });
    }
    
    if (customerName && customerName.length > VALIDATION_RULES.CUSTOMER_NAME_MAX_LENGTH) {
      this.errors.push({
        field: 'customerName',
        message: 'Customer name too long (max 100 characters)',
        severity: 'error'
      });
    }
    
    return this;
  }

  validatePayment(data) {
    const { dreamDollarValue, cardLastSix, cardExp } = data;
    
    if (!dreamDollarValue || dreamDollarValue < VALIDATION_RULES.MIN_DREAM_DOLLAR_PURCHASE) {
      this.errors.push({
        field: 'dreamDollarValue',
        message: `Minimum purchase: $${VALIDATION_RULES.MIN_DREAM_DOLLAR_PURCHASE}`,
        severity: 'error'
      });
    }
    
    if (dreamDollarValue > VALIDATION_RULES.MAX_DREAM_DOLLAR_PURCHASE) {
      this.errors.push({
        field: 'dreamDollarValue',
        message: `Maximum purchase: $${VALIDATION_RULES.MAX_DREAM_DOLLAR_PURCHASE} — Manager approval required`,
        severity: 'warning'
      });
    }
    
    if (!cardLastSix || cardLastSix.length !== VALIDATION_RULES.CARD_LAST_SIX_LENGTH) {
      this.errors.push({
        field: 'cardLastSix',
        message: 'Card last 6 digits required',
        severity: 'error'
      });
    }
    
    if (cardExp && !VALIDATION_RULES.CARD_EXP_PATTERN.test(cardExp)) {
      this.errors.push({
        field: 'cardExp',
        message: 'Invalid expiration format (use MM/YY)',
        severity: 'error'
      });
    }
    
    return this;
  }

  validateBiometrics(data) {
    const { signature, thumbprintUrl, guestPhotoUrl, idPhotoUrl } = data;
    
    if (!signature || signature.trim().length < VALIDATION_RULES.MIN_SIGNATURE_LENGTH) {
      this.errors.push({
        field: 'signature',
        message: 'Signature required (full name)',
        severity: 'error'
      });
    }
    
    if (!thumbprintUrl) {
      this.errors.push({
        field: 'thumbprintUrl',
        message: 'Thumbprint capture required',
        severity: 'error'
      });
    }
    
    if (!guestPhotoUrl) {
      this.errors.push({
        field: 'guestPhotoUrl',
        message: 'Guest photo required',
        severity: 'error'
      });
    }
    
    if (!idPhotoUrl) {
      this.errors.push({
        field: 'idPhotoUrl',
        message: 'Government ID photo required',
        severity: 'error'
      });
    }
    
    return this;
  }

  validateStaffSignatures(data) {
    const { managerSignature, hostessSignature } = data;
    
    if (!managerSignature || managerSignature.trim().length < 2) {
      this.errors.push({
        field: 'managerSignature',
        message: 'Manager signature required',
        severity: 'error'
      });
    }
    
    if (!hostessSignature || hostessSignature.trim().length < 2) {
      this.errors.push({
        field: 'hostessSignature',
        message: 'Hostess signature required',
        severity: 'error'
      });
    }
    
    return this;
  }

  getErrors() {
    return this.errors;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrorsByField(field) {
    return this.errors.filter(e => e.field === field);
  }

  clear() {
    this.errors = [];
    return this;
  }
}

export function sanitizeContractData(data) {
  return {
    ...data,
    customerName: data.customerName?.trim(),
    customerId: data.customerId?.trim().toUpperCase(),
    customerAddress: data.customerAddress?.trim(),
    customerState: data.customerState?.trim().toUpperCase(),
    customerZip: data.customerZip?.replace(/\D/g, '').slice(0, 10),
    purchaserCardName: data.purchaserCardName?.trim(),
    cardLastSix: data.cardLastSix?.replace(/\D/g, '').slice(0, 6),
    cardExp: data.cardExp?.trim(),
    signature: data.signature?.trim(),
    managerSignature: data.managerSignature?.trim(),
    hostessSignature: data.hostessSignature?.trim(),
  };
}

export function calculateContractFinancials(dreamDollarValue, lineItems) {
  const processingSurcharge = dreamDollarValue * VALIDATION_RULES.SURCHARGE_RATE;
  const lineItemsTotal = lineItems.reduce((s, li) => s + (li.amount || 0), 0);
  const grandTotal = dreamDollarValue + processingSurcharge + lineItemsTotal;
  const entertainerPayout = dreamDollarValue * 0.50; // 50% payout rate
  
  return {
    dreamDollarValue,
    processingSurcharge,
    lineItemsTotal,
    grandTotal,
    entertainerPayout,
    venueNet: dreamDollarValue - entertainerPayout + processingSurcharge,
  };
}