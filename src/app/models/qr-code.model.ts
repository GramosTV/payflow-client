export interface QRCode {
  id?: number;
  qrId: string;
  walletNumber: string;
  amount?: number;
  isAmountFixed: boolean;
  isOneTime: boolean;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  expiresAt?: Date;

  // Frontend display properties
  walletId?: number; // Optional field for backward compatibility
  currency?: string;
  qrCodeImage?: string; // Base64 encoded QR code image
  expirationTime?: string; // ISO date string for expiration
}
