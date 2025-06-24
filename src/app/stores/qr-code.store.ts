import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';

import { ApiService } from '../services/api.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { QRCode } from '../models/qr-code.model';
import { Transaction } from '../models/transaction.model';

interface QRCodeState {
  qrCodes: QRCode[];
  currentQRCode: QRCode | null;
  qrCodeImage: string | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

const initialState: QRCodeState = {
  qrCodes: [],
  currentQRCode: null,
  qrCodeImage: null,
  isLoading: false,
  isProcessing: false,
  error: null,
};

export const QRCodeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, apiService = inject(ApiService), errorHandler = inject(ErrorHandlingService)) => {
      const loadUserQRCodes = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<QRCode[]>('qr-codes').pipe(
              tap((qrCodes: QRCode[]) => {
                patchState(store, {
                  qrCodes,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load QR codes.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve QR codes');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadQRCodeById = rxMethod<{ id: number }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ id }) => {
            return apiService.get<QRCode>(`qr-codes/${id}`).pipe(
              tap((qrCode: QRCode) => {
                patchState(store, {
                  currentQRCode: qrCode,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: `Failed to load QR code with ID: ${id}.`,
                });
                errorHandler.handleApiError(error, `Failed to retrieve QR code with ID: ${id}`);
                return EMPTY;
              })
            );
          })
        )
      );

      const loadQRCodeImage = rxMethod<{ id: number }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ id }) => {
            return apiService
              .get<{ imageData: string; qrId: string; id: string }>(`qr-codes/${id}/image`)
              .pipe(
                tap((response: { imageData: string; qrId: string; id: string }) => {
                  if (!response.imageData) {
                    throw new Error('Image data is missing in the response');
                  }
                  patchState(store, {
                    qrCodeImage: response.imageData,
                    isLoading: false,
                  });
                }),
                catchError((error: unknown) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Failed to load QR code image with ID: ${id}.`,
                  });
                  errorHandler.handleApiError(
                    error,
                    `Failed to retrieve QR code image with ID: ${id}`
                  );
                  return EMPTY;
                })
              );
          })
        )
      );

      const createQRCode = rxMethod<{
        walletNumber: string;
        amount?: number;
        isAmountFixed: boolean;
        isOneTime: boolean;
        description?: string;
        expiresAt?: Date;
      }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(qrCodeData => {
            return apiService.post<QRCode>('qr-codes', qrCodeData).pipe(
              tap((newQRCode: QRCode) => {
                patchState(store, {
                  qrCodes: [...store.qrCodes(), newQRCode],
                  currentQRCode: newQRCode,
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('QR code created successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to create QR code.',
                });
                errorHandler.handleApiError(error, 'Failed to create QR code');
                return EMPTY;
              })
            );
          })
        )
      );

      const generatePaymentQRCode = rxMethod<{
        walletNumber?: string;
        amount?: number;
        isAmountFixed?: boolean;
        isOneTime?: boolean;
        description?: string;
        expiresAt?: Date;
        expirationMinutes?: number;
      }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(qrCodeData => {
            // Set default values if not provided
            const finalData = {
              ...qrCodeData,
              walletNumber: qrCodeData.walletNumber || '',
              isAmountFixed: qrCodeData.isAmountFixed ?? true,
              isOneTime: qrCodeData.isOneTime ?? true,
            };

            // Handle expiration minutes by converting to expiresAt date
            if (qrCodeData.expirationMinutes && !qrCodeData.expiresAt) {
              const expiresAt = new Date();
              expiresAt.setMinutes(expiresAt.getMinutes() + qrCodeData.expirationMinutes);
              finalData.expiresAt = expiresAt;
            }

            return apiService.post<QRCode>('qr-codes', finalData).pipe(
              tap((newQRCode: QRCode) => {
                patchState(store, {
                  qrCodes: [...store.qrCodes(), newQRCode],
                  currentQRCode: newQRCode,
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('Payment QR code generated successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to generate payment QR code.',
                });
                errorHandler.handleApiError(error, 'Failed to generate payment QR code');
                return EMPTY;
              })
            );
          })
        )
      );

      const processQRCodePayment = rxMethod<{
        qrCodeId: string;
        amount?: number;
        paymentMethodId?: string;
        sourceWalletNumber?: string;
      }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(paymentData => {
            return apiService
              .post<Transaction>(`qr-codes/${paymentData.qrCodeId}/pay`, {
                sourceWalletNumber: paymentData.sourceWalletNumber,
                amount: paymentData.amount,
                paymentMethodId: paymentData.paymentMethodId,
              })
              .pipe(
                tap(() => {
                  patchState(store, { isProcessing: false });
                  errorHandler.showSuccessMessage('Payment processed successfully');
                }),
                catchError((error: unknown) => {
                  patchState(store, {
                    isProcessing: false,
                    error: 'Failed to process QR code payment.',
                  });
                  errorHandler.handleApiError(error, 'Failed to process QR code payment');
                  return EMPTY;
                })
              );
          })
        )
      );

      const deactivateQRCode = rxMethod<{ id: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ id }) => {
            return apiService.post<QRCode>(`qr-codes/${id}/deactivate`, {}).pipe(
              tap((updatedQRCode: QRCode) => {
                // Update the QR code in the list
                const updatedQRCodes = store
                  .qrCodes()
                  .map(qr => (qr.id === updatedQRCode.id ? updatedQRCode : qr));
                patchState(store, {
                  qrCodes: updatedQRCodes,
                  currentQRCode:
                    store.currentQRCode()?.id === updatedQRCode.id
                      ? updatedQRCode
                      : store.currentQRCode(),
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('QR code deactivated successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: `Failed to deactivate QR code with ID: ${id}.`,
                });
                errorHandler.handleApiError(error, `Failed to deactivate QR code with ID: ${id}`);
                return EMPTY;
              })
            );
          })
        )
      );

      const clearError = () => {
        patchState(store, { error: null });
      };

      const clearCurrentQRCode = () => {
        patchState(store, {
          currentQRCode: null,
          qrCodeImage: null,
        });
      };

      const resetQRCodes = () => {
        patchState(store, {
          qrCodes: [],
          currentQRCode: null,
          qrCodeImage: null,
        });
      };

      return {
        loadUserQRCodes,
        loadQRCodeById,
        loadQRCodeImage,
        createQRCode,
        generatePaymentQRCode,
        processQRCodePayment,
        deactivateQRCode,
        clearError,
        clearCurrentQRCode,
        resetQRCodes,
      };
    }
  )
);
