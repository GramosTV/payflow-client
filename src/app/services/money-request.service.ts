import { Injectable, inject } from '@angular/core';
import { MoneyRequestStore } from '../stores/money-request.store';
import { MoneyRequest } from '../models/money-request.model';

@Injectable({
  providedIn: 'root',
})
export class MoneyRequestService {
  private moneyRequestStore = inject(MoneyRequestStore);

  /**
   * Get incoming requests signal
   */
  get incomingRequests() {
    return this.moneyRequestStore.incomingRequests;
  }

  /**
   * Get outgoing requests signal
   */
  get outgoingRequests() {
    return this.moneyRequestStore.outgoingRequests;
  }

  /**
   * Get pending requests signal
   */
  get pendingRequests() {
    return this.moneyRequestStore.pendingRequests;
  }

  /**
   * Get loading state signal
   */
  get isLoading() {
    return this.moneyRequestStore.isLoading;
  }

  /**
   * Get error state signal
   */
  get error() {
    return this.moneyRequestStore.error;
  }

  /**
   * Load incoming money requests
   */
  loadIncomingRequests(): void {
    this.moneyRequestStore.loadIncomingRequests();
  }

  /**
   * Load outgoing money requests
   */
  loadOutgoingRequests(): void {
    this.moneyRequestStore.loadOutgoingRequests();
  }

  /**
   * Load pending money requests
   */
  loadPendingRequests(): void {
    this.moneyRequestStore.loadPendingRequests();
  }

  /**
   * Create a new money request
   */
  createMoneyRequest(requestData: {
    requesteeEmail: string;
    walletNumber: string;
    amount: number;
    description?: string;
  }): void {
    this.moneyRequestStore.createRequest(requestData);
  }

  /**
   * Accept a money request
   */
  acceptMoneyRequest(requestId: number, sourceWalletId: number): void {
    this.moneyRequestStore.acceptRequest({ requestId, sourceWalletId });
  }

  /**
   * Pay a money request using a payment method
   */
  payMoneyRequest(requestId: number, paymentMethodId: number): void {
    this.moneyRequestStore.payRequest({ requestId, paymentMethodId });
  }

  /**
   * Reject a money request
   */
  rejectMoneyRequest(requestId: number): void {
    this.moneyRequestStore.rejectRequest({ requestId });
  }

  /**
   * Cancel a money request
   */
  cancelMoneyRequest(requestId: number): void {
    this.moneyRequestStore.cancelRequest({ requestId });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.moneyRequestStore.clearError();
  }
}
