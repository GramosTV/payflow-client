export enum PaymentMethodType {
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  PAYPAL = 'PAYPAL',
  WALLET = 'WALLET',
}

export interface PaymentMethod {
  id?: number;
  userId?: number;
  type: PaymentMethodType;
  provider: string;
  accountNumber?: string;
  expiryDate?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Display properties for UI
  name?: string;
  lastFourDigits?: string;
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType;
  provider: string;
  accountNumber?: string;
  expiryDate?: string;
  isDefault?: boolean;
}

export interface AddMoneyRequest {
  amount: number;
  paymentMethodId: number;
}

export interface WithdrawRequest {
  amount: number;
  paymentMethodId: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
}
