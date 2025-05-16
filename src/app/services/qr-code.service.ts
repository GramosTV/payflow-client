import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { QRCode } from '../models/qr-code.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class QRCodeService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all QR codes for the current user
   */
  getUserQRCodes(): Observable<QRCode[]> {
    return this.apiService.get<QRCode[]>('qr-codes');
  }

  /**
   * Get QR code by ID
   */
  getQRCodeById(id: number): Observable<QRCode> {
    return this.apiService.get<QRCode>(`qr-codes/${id}`);
  }

  /**
   * Get QR code image by ID
   */
  getQRCodeImageById(id: number): Observable<string> {
    return this.apiService
      .get<{ imageData: string }>(`qr-codes/${id}/image`)
      .pipe(map((response) => response.imageData));
  }

  /**
   * Create a new QR code
   */
  createQRCode(qrCodeData: {
    walletNumber: string;
    amount?: number;
    isAmountFixed: boolean;
    isOneTime: boolean;
    description?: string;
    expiresAt?: Date;
  }): Observable<QRCode> {
    return this.apiService.post<QRCode>('qr-codes', qrCodeData);
  }

  /**
   * Generate a payment QR code (alias for createQRCode)
   */
  generatePaymentQRCode(qrCodeData: {
    walletNumber?: string;
    amount?: number;
    isAmountFixed?: boolean;
    isOneTime?: boolean;
    description?: string;
    expiresAt?: Date;
    expirationMinutes?: number;
  }): Observable<QRCode> {
    // Set default values if not provided
    const finalData = {
      ...qrCodeData,
      walletNumber: qrCodeData.walletNumber || '', // Wallet number is required
      isAmountFixed: qrCodeData.isAmountFixed ?? true,
      isOneTime: qrCodeData.isOneTime ?? true,
    };

    // Handle expiration minutes by converting to expiresAt date
    if (qrCodeData.expirationMinutes && !qrCodeData.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setMinutes(
        expiresAt.getMinutes() + qrCodeData.expirationMinutes
      );
      finalData.expiresAt = expiresAt;
    }

    return this.createQRCode(finalData);
  }

  /**
   * Process payment using QR code
   */
  processQRCodePayment(data: {
    qrCodeId: string;
    amount?: number;
    paymentMethodId?: string;
    sourceWalletNumber?: string;
  }): Observable<Transaction> {
    return this.apiService.post<Transaction>(`qr-codes/${data.qrCodeId}/pay`, {
      sourceWalletNumber: data.sourceWalletNumber,
      amount: data.amount,
      paymentMethodId: data.paymentMethodId,
    });
  }

  /**
   * Deactivate QR code
   */
  deactivateQRCode(id: number): Observable<QRCode> {
    return this.apiService.post<QRCode>(`qr-codes/${id}/deactivate`, {});
  }
}
