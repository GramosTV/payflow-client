import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';

import { ApiService } from '../services/api.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { MoneyRequest } from '../models/money-request.model';
import { Transaction } from '../models/transaction.model';
import { PaginatedResponse } from '../models/http.model';

interface MoneyRequestState {
  incomingRequests: MoneyRequest[];
  outgoingRequests: MoneyRequest[];
  pendingRequests: MoneyRequest[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

const initialState: MoneyRequestState = {
  incomingRequests: [],
  outgoingRequests: [],
  pendingRequests: [],
  isLoading: false,
  isProcessing: false,
  error: null,
};

export const MoneyRequestStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, apiService = inject(ApiService), errorHandler = inject(ErrorHandlingService)) => {
      const loadIncomingRequests = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<MoneyRequest[]>('money-requests/received').pipe(
              tap((requests: MoneyRequest[]) => {
                patchState(store, {
                  incomingRequests: requests,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load incoming requests.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve incoming requests');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadOutgoingRequests = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<MoneyRequest[]>('money-requests/sent').pipe(
              tap((requests: MoneyRequest[]) => {
                patchState(store, {
                  outgoingRequests: requests,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load outgoing requests.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve outgoing requests');
                return EMPTY;
              })
            );
          })
        )
      );

      const loadPendingRequests = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return apiService.get<MoneyRequest[]>('money-requests/pending').pipe(
              tap((requests: MoneyRequest[]) => {
                patchState(store, {
                  pendingRequests: requests,
                  isLoading: false,
                });
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load pending requests.',
                });
                errorHandler.handleApiError(error, 'Failed to retrieve pending requests');
                return EMPTY;
              })
            );
          })
        )
      );

      const createRequest = rxMethod<{
        requesteeEmail: string;
        walletNumber: string;
        amount: number;
        description?: string;
      }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(requestData => {
            return apiService.post<MoneyRequest>('money-requests', requestData).pipe(
              tap((newRequest: MoneyRequest) => {
                patchState(store, {
                  outgoingRequests: [...store.outgoingRequests(), newRequest],
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('Money request created successfully');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to create money request.',
                });
                errorHandler.handleApiError(error, 'Failed to create money request');
                return EMPTY;
              })
            );
          })
        )
      );

      const acceptRequest = rxMethod<{ requestId: number; sourceWalletId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ requestId, sourceWalletId }) => {
            return apiService
              .post<Transaction>(`money-requests/${requestId}/accept`, { sourceWalletId })
              .pipe(
                tap(() => {
                  // Remove the request from incoming requests
                  patchState(store, {
                    incomingRequests: store.incomingRequests().filter(r => r.id !== requestId),
                    isProcessing: false,
                  });
                  errorHandler.showSuccessMessage('Money request accepted successfully');
                }),
                catchError((error: unknown) => {
                  patchState(store, {
                    isProcessing: false,
                    error: 'Failed to accept money request.',
                  });
                  errorHandler.handleApiError(error, 'Failed to accept money request');
                  return EMPTY;
                })
              );
          })
        )
      );

      const payRequest = rxMethod<{ requestId: number; paymentMethodId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ requestId, paymentMethodId }) => {
            return apiService
              .post<Transaction>(`money-requests/${requestId}/pay`, { paymentMethodId })
              .pipe(
                tap(() => {
                  // Remove the request from incoming requests
                  patchState(store, {
                    incomingRequests: store.incomingRequests().filter(r => r.id !== requestId),
                    isProcessing: false,
                  });
                  errorHandler.showSuccessMessage('Payment sent successfully');
                }),
                catchError((error: unknown) => {
                  patchState(store, {
                    isProcessing: false,
                    error: 'Failed to pay money request.',
                  });
                  errorHandler.handleApiError(error, 'Failed to pay money request');
                  return EMPTY;
                })
              );
          })
        )
      );

      const rejectRequest = rxMethod<{ requestId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ requestId }) => {
            return apiService.post<MoneyRequest>(`money-requests/${requestId}/reject`, {}).pipe(
              tap(() => {
                // Remove the request from incoming requests
                patchState(store, {
                  incomingRequests: store.incomingRequests().filter(r => r.id !== requestId),
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('Money request rejected');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to reject money request.',
                });
                errorHandler.handleApiError(error, 'Failed to reject money request');
                return EMPTY;
              })
            );
          })
        )
      );

      const cancelRequest = rxMethod<{ requestId: number }>(
        pipe(
          tap(() => patchState(store, { isProcessing: true, error: null })),
          switchMap(({ requestId }) => {
            return apiService.post<MoneyRequest>(`money-requests/${requestId}/cancel`, {}).pipe(
              tap(() => {
                // Remove the request from outgoing requests
                patchState(store, {
                  outgoingRequests: store.outgoingRequests().filter(r => r.id !== requestId),
                  isProcessing: false,
                });
                errorHandler.showSuccessMessage('Money request cancelled');
              }),
              catchError((error: unknown) => {
                patchState(store, {
                  isProcessing: false,
                  error: 'Failed to cancel money request.',
                });
                errorHandler.handleApiError(error, 'Failed to cancel money request');
                return EMPTY;
              })
            );
          })
        )
      );

      const clearError = () => {
        patchState(store, { error: null });
      };

      const resetRequests = () => {
        patchState(store, {
          incomingRequests: [],
          outgoingRequests: [],
          pendingRequests: [],
        });
      };

      return {
        loadIncomingRequests,
        loadOutgoingRequests,
        loadPendingRequests,
        createRequest,
        acceptRequest,
        payRequest,
        rejectRequest,
        cancelRequest,
        clearError,
        resetRequests,
      };
    }
  )
);
