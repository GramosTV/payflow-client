import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ErrorHandlingService } from './error-handling.service';
import { Transaction } from '../models/transaction.model';

// Define a generic Page interface to represent Spring's Page object
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService implements OnDestroy {
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
   * Get all transactions for the current user with pagination
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of Page<Transaction>
   */
  getUserTransactions(page = 0, size = 10): Observable<Page<Transaction>> {
    return this.apiService.get<Page<Transaction>>(`transactions?page=${page}&size=${size}`).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to retrieve transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get recent transactions with limit
   * @param limit Maximum number of transactions to retrieve
   * @returns Observable of Transaction array
   */
  getRecentTransactions(limit: number): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>(`transactions/recent?limit=${limit}`).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to retrieve recent transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all transactions (alias for getUserTransactions, extracting content)
   * @returns Observable of Transaction array
   */
  getAllTransactions(): Observable<Transaction[]> {
    return this.apiService.get<Page<Transaction>>('transactions').pipe(
      takeUntil(this.destroy$),
      map(page => page.content),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to retrieve all transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transactions with custom params (alias for getUserTransactions, extracting content)
   * @param limit Maximum number of transactions to retrieve
   * @returns Observable of Transaction array
   */
  getTransactions(limit: number): Observable<Transaction[]> {
    return this.apiService.get<Page<Transaction>>(`transactions?size=${limit}&page=0`).pipe(
      takeUntil(this.destroy$),
      map(page => page.content),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to retrieve transactions');
        return throwError(() => error);
      })
    );
  }

  /**
   * Download transaction receipt
   * @param transactionId ID of transaction to download receipt for
   * @returns Observable of Blob containing receipt data
   */
  downloadTransactionReceipt(transactionId: number): Observable<Blob> {
    return this.apiService.getBinary(`transactions/${transactionId}/receipt`).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorHandlingService.handleApiError(error, 'Failed to download transaction receipt');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transaction by ID
   * @param id Transaction ID
   * @returns Observable of Transaction
   */
  getTransactionById(id: number): Observable<Transaction> {
    return this.apiService.get<Transaction>(`transactions/${id}`).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorHandlingService.handleApiError(
          error,
          `Failed to retrieve transaction with ID: ${id}`
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Search transactions by date range
   * @param startDate Start date for search range
   * @param endDate End date for search range
   * @returns Observable of Transaction array
   */
  searchTransactions(startDate: Date, endDate: Date): Observable<Transaction[]> {
    // Format dates as ISO strings (YYYY-MM-DD)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    return this.apiService
      .get<
        Transaction[]
      >(`transactions/search?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.errorHandlingService.handleApiError(error, 'Failed to search transactions');
          return throwError(() => error);
        })
      );
  }
}
