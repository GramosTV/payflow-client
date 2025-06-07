import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ErrorHandlingService } from './error-handling.service';
import { QRCode } from '../models/qr-code.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class QRCodeService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private errorHandlingService: ErrorHandlingService
  ) {}

  /**
   * Clean up subscriptions when service is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get all QR codes for the current user
   * @returns Observable of QRCode array
   */
  getUserQRCodes(): Observable<QRCode[]> {
    return this.apiService.get<QRCode[]>('qr-codes').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to retrieve QR codes'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Get QR code by ID
   * @param id QR Code ID
   * @returns Observable of QRCode
   */
  getQRCodeById(id: number): Observable<QRCode> {
    return this.apiService.get<QRCode>(`qr-codes/${id}`).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          `Failed to retrieve QR code with ID: ${id}`
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Get QR code image by ID
   * @param id QR Code ID
   * @returns Observable of image data string
   */
  getQRCodeImageById(id: number): Observable<string> {
    return this.apiService
      .get<{ imageData: string; qrId: string; id: string }>(
        `qr-codes/${id}/image`
      )
      .pipe(
        takeUntil(this.destroy$),
        map((response) => {
          if (!response.imageData) {
            throw new Error('Image data is missing in the response');
          }
          return response.imageData;
        }),
        catchError((error) => {
          this.errorHandlingService.handleApiError(
            error,
            `Failed to retrieve QR code image with ID: ${id}`
          );
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new QR code
   * @param qrCodeData QR code data to create
   * @returns Observable of created QRCode
   */
  createQRCode(qrCodeData: {
    walletNumber: string;
    amount?: number;
    isAmountFixed: boolean;
    isOneTime: boolean;
    description?: string;
    expiresAt?: Date;
  }): Observable<QRCode> {
    return this.apiService.post<QRCode>('qr-codes', qrCodeData).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to create QR code'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate a payment QR code (alias for createQRCode with defaults)
   * @param qrCodeData QR code configuration data
   * @returns Observable of created QRCode
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
   * @param data Payment data including QR code ID
   * @returns Observable of Transaction
   */
  processQRCodePayment(data: {
    qrCodeId: string;
    amount?: number;
    paymentMethodId?: string;
    sourceWalletNumber?: string;
  }): Observable<Transaction> {
    return this.apiService
      .post<Transaction>(`qr-codes/${data.qrCodeId}/pay`, {
        sourceWalletNumber: data.sourceWalletNumber,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
      })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorHandlingService.handleApiError(
            error,
            'Failed to process QR code payment'
          );
          return throwError(() => error);
        })
      );
  }

  /**
   * Deactivate QR code
   * @param id QR code ID to deactivate
   * @returns Observable of updated QRCode
   */
  deactivateQRCode(id: number): Observable<QRCode> {
    return this.apiService.post<QRCode>(`qr-codes/${id}/deactivate`, {}).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          `Failed to deactivate QR code with ID: ${id}`
        );
        return throwError(() => error);
      })
    );
  }
}
