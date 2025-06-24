import { Injectable, inject } from '@angular/core';
import { WalletStore } from '../stores/wallet.store';
import {
  PaymentMethod,
  CreatePaymentMethodRequest,
  AddMoneyRequest,
  WithdrawRequest,
} from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private walletStore = inject(WalletStore);

  /**
   * Get wallet state signal
   */
  get wallet() {
    return this.walletStore.wallet;
  }

  /**
   * Get payment methods signal
   */
  get paymentMethods() {
    return this.walletStore.paymentMethods;
  }

  /**
   * Get loading state signal
   */
  get isLoading() {
    return this.walletStore.isLoading;
  }

  /**
   * Get error state signal
   */
  get error() {
    return this.walletStore.error;
  }

  /**
   * Load wallet data
   */
  loadWallet(): void {
    this.walletStore.loadWallet();
  }

  /**
   * Load payment methods
   */
  loadPaymentMethods(): void {
    this.walletStore.loadPaymentMethods();
  }

  /**
   * Add money to wallet from payment method
   * @param amount Amount to add
   * @param paymentMethodId ID of payment method to use
   */
  addMoney(amount: number, paymentMethodId: number): void {
    const request: AddMoneyRequest = { amount, paymentMethodId };
    this.walletStore.addMoney(request);
  }

  /**
   * Withdraw money from wallet to payment method
   * @param amount Amount to withdraw
   * @param paymentMethodId ID of payment method to use
   */
  withdraw(amount: number, paymentMethodId: number): void {
    this.walletStore.withdraw({ amount, paymentMethodId });
  }

  /**
   * Add new payment method
   * @param paymentMethod Payment method object
   */
  addPaymentMethod(paymentMethod: CreatePaymentMethodRequest): void {
    this.walletStore.addPaymentMethod(paymentMethod);
  }

  /**
   * Remove payment method
   * @param id ID of payment method to remove
   */
  removePaymentMethod(id: number): void {
    this.walletStore.removePaymentMethod(id);
  }

  /**
   * Transfer money between wallets
   * @param transferData Object containing transfer details
   */
  transferMoney(transferData: {
    sourceWalletId: number;
    destinationWalletNumber: string;
    amount: number;
    description?: string;
  }): void {
    this.walletStore.transferMoney(transferData);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.walletStore.clearError();
  }
}
