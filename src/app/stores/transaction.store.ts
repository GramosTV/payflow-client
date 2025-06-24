import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';

import { ApiService } from '../services/api.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { Transaction } from '../models/transaction.model';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface TransactionState {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const initialState: TransactionState = {
  transactions: [],
  recentTransactions: [],
  isLoading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 10,
};

export const TransactionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, apiService = inject(ApiService), errorHandler = inject(ErrorHandlingService)) => {
      const loadTransactions = rxMethod<{ page?: number; size?: number }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ page = 0, size = 10 }) => {
            return apiService.get<Page<Transaction>>(`transactions?page=${page}&size=${size}`).pipe(
              tap((response: Page<Transaction>) => {
                patchState(store, {
                  transactions: response.content,
                  totalElements: response.totalElements,
                  totalPages: response.totalPages,
                  currentPage: response.number,
                  pageSize: response.size,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load transactions.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve transactions');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadAllTransactions = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<Page<Transaction>>('transactions').pipe(
              tap((response: Page<Transaction>) => {
                patchState(store, {
                  transactions: response.content,
                  totalElements: response.totalElements,
                  totalPages: response.totalPages,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load all transactions.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve all transactions');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadRecentTransactions = rxMethod<{ limit: number }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ limit }) => {
            return apiService.get<Transaction[]>(`transactions/recent?limit=${limit}`).pipe(
              tap((transactions: Transaction[]) => {
                patchState(store, {
                  recentTransactions: transactions,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load recent transactions.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve recent transactions');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadTransactionById = rxMethod<{ id: number }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ id }) => {
            return apiService.get<Transaction>(`transactions/${id}`).pipe(
              tap((transaction: Transaction) => {
                // Update the transaction in the list if it exists
                const updatedTransactions = store
                  .transactions()
                  .map(t => (t.id === transaction.id ? transaction : t));
                patchState(store, {
                  transactions: updatedTransactions,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: `Failed to load transaction with ID: ${id}.`,
                });
                errorHandler.handleApiError(error, `Failed to retrieve transaction with ID: ${id}`);
                return EMPTY;
              })
            );
          })
        )
      );

      const searchTransactions = rxMethod<{ startDate: Date; endDate: Date }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ startDate, endDate }) => {
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            return apiService
              .get<
                Transaction[]
              >(`transactions/search?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
              .pipe(
                tap((transactions: Transaction[]) => {
                  patchState(store, {
                    transactions,
                    isLoading: false,
                  });
                }),
                catchError((error: unknown) => {
                  patchState(store, {
                    isLoading: false,
                    error: 'Failed to search transactions.',
                  });
                  errorHandler.handleApiError(error, 'Failed to search transactions');
                  return EMPTY;
                })
              );
          })
        )
      );

      const downloadReceipt = rxMethod<{ transactionId: number }>(
        pipe(
          switchMap(({ transactionId }) => {
            return apiService.getBinary(`transactions/${transactionId}/receipt`).pipe(
              tap((blob: Blob) => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transaction-${transactionId}-receipt.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                errorHandler.showSuccessMessage('Receipt downloaded successfully');
              }),
              catchError((error: unknown) => {
                errorHandler.handleApiError(error, 'Failed to download transaction receipt');
                return EMPTY;
              })
            );
          })
        )
      );

      const clearError = () => {
        patchState(store, { error: null });
      };

      const resetTransactions = () => {
        patchState(store, {
          transactions: [],
          recentTransactions: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
        });
      };

      return {
        loadTransactions,
        loadAllTransactions,
        loadRecentTransactions,
        loadTransactionById,
        searchTransactions,
        downloadReceipt,
        clearError,
        resetTransactions,
      };
    }
  )
);
