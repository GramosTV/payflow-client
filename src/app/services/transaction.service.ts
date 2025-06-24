import { Injectable, inject } from '@angular/core';
import { TransactionStore } from '../stores/transaction.store';

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
export class TransactionService {
  private transactionStore = inject(TransactionStore);

  /**
   * Get transactions signal
   */
  get transactions() {
    return this.transactionStore.transactions;
  }

  /**
   * Get recent transactions signal
   */
  get recentTransactions() {
    return this.transactionStore.recentTransactions;
  }

  /**
   * Get loading state signal
   */
  get isLoading() {
    return this.transactionStore.isLoading;
  }

  /**
   * Get error state signal
   */
  get error() {
    return this.transactionStore.error;
  }

  /**
   * Load transactions with pagination
   * @param page Page number (0-indexed)
   * @param size Page size
   */
  loadTransactions(page = 0, size = 10): void {
    this.transactionStore.loadTransactions({ page, size });
  }

  /**
   * Load recent transactions
   * @param limit Maximum number of transactions to retrieve
   */
  loadRecentTransactions(limit = 10): void {
    this.transactionStore.loadRecentTransactions({ limit });
  }

  /**
   * Search transactions by date range
   * @param startDate Start date for search range
   * @param endDate End date for search range
   */
  searchTransactions(startDate: Date, endDate: Date): void {
    this.transactionStore.searchTransactions({ startDate, endDate });
  }

  /**
   * Download transaction receipt
   * @param transactionId ID of transaction to download receipt for
   */
  downloadReceipt(transactionId: number): void {
    this.transactionStore.downloadReceipt({ transactionId });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.transactionStore.clearError();
  }

  /**
   * Reset transactions state
   */
  resetTransactions(): void {
    this.transactionStore.resetTransactions();
  }
}
