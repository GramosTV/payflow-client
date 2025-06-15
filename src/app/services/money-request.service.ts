import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MoneyRequest } from '../models/money-request.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class MoneyRequestService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all money requests for the current user
   */
  getUserMoneyRequests(): Observable<MoneyRequest[]> {
    return this.apiService.get<MoneyRequest[]>('money-requests');
  }

  /**
   * Get money requests sent by the current user
   */
  getSentMoneyRequests(): Observable<MoneyRequest[]> {
    return this.apiService.get<MoneyRequest[]>('money-requests/sent');
  }

  /**
   * Alias for getSentMoneyRequests
   */
  getOutgoingRequests(): Observable<MoneyRequest[]> {
    return this.getSentMoneyRequests();
  }

  /**
   * Get money requests received by the current user
   */
  getReceivedMoneyRequests(): Observable<MoneyRequest[]> {
    return this.apiService.get<MoneyRequest[]>('money-requests/received');
  }

  /**
   * Alias for getReceivedMoneyRequests
   */
  getIncomingRequests(): Observable<MoneyRequest[]> {
    return this.getReceivedMoneyRequests();
  }

  /**
   * Get pending money requests
   */
  getPendingRequests(): Observable<MoneyRequest[]> {
    return this.apiService.get<MoneyRequest[]>('money-requests/pending');
  }

  /**
   * Create a new money request
   */
  createMoneyRequest(requestData: {
    requesteeEmail: string;
    walletNumber: string; // Changed from walletId: number
    amount: number;
    description?: string;
  }): Observable<MoneyRequest> {
    return this.apiService.post<MoneyRequest>('money-requests', requestData);
  }

  /**
   * Accept a money request
   */
  acceptMoneyRequest(requestId: number, sourceWalletId: number): Observable<Transaction> {
    return this.apiService.post<Transaction>(`money-requests/${requestId}/accept`, {
      sourceWalletId,
    });
  }

  /**
   * Pay a money request using a payment method
   */
  payMoneyRequest(requestId: number, paymentMethodId: number): Observable<Transaction> {
    return this.apiService.post<Transaction>(`money-requests/${requestId}/pay`, {
      paymentMethodId,
    });
  }

  /**
   * Reject a money request
   */
  rejectMoneyRequest(requestId: number): Observable<MoneyRequest> {
    return this.apiService.post<MoneyRequest>(`money-requests/${requestId}/reject`, {});
  }

  /**
   * Cancel a money request (for the sender)
   */
  cancelMoneyRequest(requestId: number): Observable<MoneyRequest> {
    return this.apiService.post<MoneyRequest>(`money-requests/${requestId}/cancel`, {});
  }
}
