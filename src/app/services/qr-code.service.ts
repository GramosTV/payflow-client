import { Injectable, inject } from '@angular/core';
import { QRCodeStore } from '../stores/qr-code.store';
import { QRCode } from '../models/qr-code.model';

@Injectable({
  providedIn: 'root',
})
export class QRCodeService {
  private qrCodeStore = inject(QRCodeStore);

  /**
   * Get QR codes signal
   */
  get qrCodes() {
    return this.qrCodeStore.qrCodes;
  }

  /**
   * Get current QR code signal
   */
  get currentQRCode() {
    return this.qrCodeStore.currentQRCode;
  }

  /**
   * Get QR code image signal
   */
  get qrCodeImage() {
    return this.qrCodeStore.qrCodeImage;
  }

  /**
   * Get loading state signal
   */
  get isLoading() {
    return this.qrCodeStore.isLoading;
  }

  /**
   * Get error state signal
   */
  get error() {
    return this.qrCodeStore.error;
  }
  /**
   * Load all QR codes for the current user
   */
  loadUserQRCodes(): void {
    this.qrCodeStore.loadUserQRCodes();
  }

  /**
   * Load QR code by ID
   * @param id QR Code ID
   */
  loadQRCodeById(id: number): void {
    this.qrCodeStore.loadQRCodeById({ id });
  }

  /**
   * Load QR code image by ID
   * @param id QR Code ID
   */
  loadQRCodeImage(id: number): void {
    this.qrCodeStore.loadQRCodeImage({ id });
  }

  /**
   * Create a new QR code
   * @param qrCodeData QR code data to create
   */
  createQRCode(qrCodeData: {
    walletNumber: string;
    amount?: number;
    isAmountFixed: boolean;
    isOneTime: boolean;
    description?: string;
    expiresAt?: Date;
  }): void {
    this.qrCodeStore.createQRCode(qrCodeData);
  }
  /**
   * Pay a QR code
   * @param qrId QR Code ID
   * @param amount Payment amount
   * @param paymentMethodId Payment method ID
   */ payQRCode(qrId: string, amount: number, paymentMethodId: number): void {
    this.qrCodeStore.processQRCodePayment({
      qrCodeId: qrId,
      amount,
      paymentMethodId: paymentMethodId.toString(),
    });
  }

  /**
   * Deactivate a QR code
   * @param id QR Code ID
   */
  deactivateQRCode(id: number): void {
    this.qrCodeStore.deactivateQRCode({ id });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.qrCodeStore.clearError();
  }
}
