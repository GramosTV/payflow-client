import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ErrorHandlingService } from './error-handling.service';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class WalletService implements OnDestroy {
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
   * Get all wallets for the current user
   * @returns Observable of Wallet array
   */
  getUserWallets(): Observable<Wallet[]> {
    return this.apiService.get<Wallet[]>('wallets').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to retrieve wallets'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Get primary wallet for current user
   * @returns Observable of primary Wallet
   */
  getWallet(): Observable<Wallet> {
    return this.apiService.get<Wallet>('wallets/primary').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to retrieve primary wallet'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet by ID
   * @param id The wallet ID
   * @returns Observable of Wallet
   */
  getWalletById(id: number): Observable<Wallet> {
    return this.apiService.get<Wallet>(`wallets/${id}`).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          `Failed to retrieve wallet with ID: ${id}`
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new wallet
   * @param wallet Partial wallet object with required properties
   * @returns Observable of created Wallet
   */
  createWallet(wallet: Partial<Wallet>): Observable<Wallet> {
    return this.apiService.post<Wallet>('wallets', wallet).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to create new wallet'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Top up wallet
   * @param topUpData Object containing wallet number and amount
   * @returns Observable of Transaction
   */
  topUpWallet(topUpData: {
    walletNumber: string;
    amount: number;
  }): Observable<Transaction> {
    return this.apiService.post<Transaction>('wallets/topup', topUpData).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to top up wallet'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Add money to wallet from payment method
   * @param amount Amount to add
   * @param paymentMethodId ID of payment method to use
   * @returns Observable of any
   */
  addMoney(amount: number, paymentMethodId: number): Observable<any> {
    return this.apiService
      .post<any>('wallets/deposit', {
        amount,
        paymentMethodId,
      })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorHandlingService.handleApiError(
            error,
            'Failed to add money to wallet'
          );
          return throwError(() => error);
        })
      );
  }

  /**
   * Withdraw money from wallet to payment method
   * @param amount Amount to withdraw
   * @param paymentMethodId ID of payment method to use
   * @returns Observable of any
   */
  withdraw(amount: number, paymentMethodId: number): Observable<any> {
    return this.apiService
      .post<any>('wallets/withdraw', {
        amount,
        paymentMethodId,
      })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorHandlingService.handleApiError(
            error,
            'Failed to withdraw money from wallet'
          );
          return throwError(() => error);
        })
      );
  }

  /**
   * Transfer money between wallets
   * @param transferData Object containing transfer details
   * @returns Observable of Transaction
   */
  transferMoney(transferData: {
    sourceWalletId: number;
    destinationWalletNumber: string;
    amount: number;
    description?: string;
  }): Observable<Transaction> {
    return this.apiService
      .post<Transaction>('transactions/transfer', transferData)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.errorHandlingService.handleApiError(
            error,
            'Failed to transfer money'
          );
          return throwError(() => error);
        })
      );
  }

  /**
   * Get payment methods for current user
   * @returns Observable of payment methods array
   */
  getPaymentMethods(): Observable<any[]> {
    return this.apiService.get<any[]>('payment-methods').pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to retrieve payment methods'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new payment method
   * @param paymentMethod Payment method object
   * @returns Observable of created payment method
   */
  addPaymentMethod(paymentMethod: any): Observable<any> {
    return this.apiService.post<any>('payment-methods', paymentMethod).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to add payment method'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove payment method
   * @param id ID of payment method to remove
   * @returns Observable<void>
   */
  removePaymentMethod(id: number): Observable<void> {
    return this.apiService.delete<void>(`payment-methods/${id}`).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        this.errorHandlingService.handleApiError(
          error,
          'Failed to remove payment method'
        );
        return throwError(() => error);
      })
    );
  }
}
