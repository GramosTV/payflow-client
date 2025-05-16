import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
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
export class TransactionService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all transactions for the current user
   * Now expects a Page<Transaction> and maps to Transaction[]
   */
  getUserTransactions(
    page: number = 0,
    size: number = 10
  ): Observable<Page<Transaction>> {
    return this.apiService.get<Page<Transaction>>(
      `transactions?page=${page}&size=${size}`
    );
  }

  /**
   * Get recent transactions with limit
   */
  getRecentTransactions(limit: number): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>(
      `transactions/recent?limit=${limit}`
    );
  }

  /**
   * Get all transactions (alias for getUserTransactions, extracting content)
   */
  getAllTransactions(): Observable<Transaction[]> {
    return this.apiService
      .get<Page<Transaction>>('transactions')
      .pipe(map((page) => page.content));
  }

  /**
   * Get transactions with custom params (alias for getUserTransactions, extracting content)
   */
  getTransactions(limit: number): Observable<Transaction[]> {
    return this.apiService
      .get<Page<Transaction>>(`transactions?size=${limit}&page=0`)
      .pipe(map((page) => page.content));
  }

  /**
   * Download transaction receipt
   */
  downloadTransactionReceipt(transactionId: number): Observable<Blob> {
    return this.apiService.getBinary(`transactions/${transactionId}/receipt`);
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: number): Observable<Transaction> {
    return this.apiService.get<Transaction>(`transactions/${id}`);
  }

  /**
   * Search transactions by date range
   */
  searchTransactions(
    startDate: Date,
    endDate: Date
  ): Observable<Transaction[]> {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    return this.apiService.get<Transaction[]>(
      `transactions/search?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );
  }
}
