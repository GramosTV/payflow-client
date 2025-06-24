import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';

import { ApiService } from '../services/api.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';
import {
  PaymentMethod,
  AddMoneyRequest,
  WithdrawRequest,
  CreatePaymentMethodRequest,
} from '../models/payment.model';

interface WalletState {
  wallet: Wallet | null;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
}

const initialState: WalletState = {
  wallet: null,
  paymentMethods: [],
  isLoading: false,
  error: null,
  isProcessing: false,
};

export const WalletStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, apiService = inject(ApiService), errorHandler = inject(ErrorHandlingService)) => {
      const loadWallet = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<Wallet>('wallets/primary').pipe(
              tap((wallet: Wallet) => {
                patchState(store, {
                  wallet,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load wallet.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve primary wallet');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadPaymentMethods = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => {
            return apiService.get<PaymentMethod[]>('payment-methods').pipe(
              tap((paymentMethods: PaymentMethod[]) => {
                patchState(store, {
                  paymentMethods,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load payment methods.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve payment methods');
                return EMPTY;
              })
            );
          })
        )
      );

      const addMoney = rxMethod<{ amount: number; paymentMethodId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ amount, paymentMethodId }) => {
            const request: AddMoneyRequest = { amount, paymentMethodId };
            return apiService.post<Transaction>('wallets/deposit', request).pipe(
              tap(() => {
                patchState(store, { isProcessing: false });
                errorHandler.showSuccessMessage(`$${amount} added to your wallet`);
                // Reload wallet data to reflect new balance
                loadWallet();
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to add money to wallet.',
                });
                errorHandler.handleApiError(error, 'Failed to add money to wallet');
                return EMPTY;
              })
            );
          })
        )
      );

      const withdraw = rxMethod<{ amount: number; paymentMethodId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ amount, paymentMethodId }) => {
            const request: WithdrawRequest = { amount, paymentMethodId };
            return apiService.post<Transaction>('wallets/withdraw', request).pipe(
              tap(() => {
                patchState(store, { isProcessing: false });
                errorHandler.showSuccessMessage(`$${amount} withdrawn from your wallet`);
                // Reload wallet data to reflect new balance
                loadWallet();
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to withdraw money from wallet.',
                });
                errorHandler.handleApiError(error, 'Failed to withdraw money from wallet');
                return EMPTY;
              })
            );
          })
        )
      );

      const addPaymentMethod = rxMethod<CreatePaymentMethodRequest>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(paymentMethod => {
            return apiService.post<PaymentMethod>('payment-methods', paymentMethod).pipe(
              tap((newPaymentMethod: PaymentMethod) => {
                patchState(store, {
                  isProcessing: false,
                  paymentMethods: [...store.paymentMethods(), newPaymentMethod],
                });
                errorHandler.showSuccessMessage('Payment method added successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to add payment method.',
                });
                errorHandler.handleApiError(error, 'Failed to add payment method');
                return EMPTY;
              })
            );
          })
        )
      );

      const removePaymentMethod = rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(id => {
            return apiService.delete<void>(`payment-methods/${id}`).pipe(
              tap(() => {
                patchState(store, {
                  isProcessing: false,
                  paymentMethods: store.paymentMethods().filter(m => m.id !== id),
                });
                errorHandler.showSuccessMessage('Payment method removed');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to remove payment method.',
                });
                errorHandler.handleApiError(error, 'Failed to remove payment method');
                return EMPTY;
              })
            );
          })
        )
      );

      const transferMoney = rxMethod<{
        sourceWalletId: number;
        destinationWalletNumber: string;
        amount: number;
        description?: string;
      }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(transferData => {
            return apiService.post<Transaction>('transactions/transfer', transferData).pipe(
              tap(() => {
                patchState(store, { isProcessing: false });
                errorHandler.showSuccessMessage(`$${transferData.amount} transferred successfully`);
                // Reload wallet data to reflect new balance
                loadWallet();
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to transfer money.',
                });
                errorHandler.handleApiError(error, 'Failed to transfer money');
                return EMPTY;
              })
            );
          })
        )
      );

      const createWallet = rxMethod<Partial<Wallet>>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(walletData => {
            return apiService.post<Wallet>('wallets', walletData).pipe(
              tap((wallet: Wallet) => {
                patchState(store, {
                  wallet,
                  isLoading: false,
                });
                errorHandler.showSuccessMessage('Wallet created successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to create wallet.',
                });
                errorHandler.handleApiError(error, 'Failed to create new wallet');
                return EMPTY;
              })
            );
          })
        )
      );

      const clearError = () => {
        patchState(store, { error: null });
      };

      return {
        loadWallet,
        loadPaymentMethods,
        addMoney,
        withdraw,
        addPaymentMethod,
        removePaymentMethod,
        transferMoney,
        createWallet,
        clearError,
      };
    }
  )
);
