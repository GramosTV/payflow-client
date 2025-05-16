import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Wallet } from '../models/wallet.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all wallets for the current user
   */
  getUserWallets(): Observable<Wallet[]> {
    return this.apiService.get<Wallet[]>('wallets');
  }

  /**
   * Get primary wallet for current user
   */
  getWallet(): Observable<Wallet> {
    return this.apiService.get<Wallet>('wallets/primary');
  }

  /**
   * Get wallet by ID
   */
  getWalletById(id: number): Observable<Wallet> {
    return this.apiService.get<Wallet>(`wallets/${id}`);
  }

  /**
   * Create a new wallet
   */
  createWallet(wallet: Partial<Wallet>): Observable<Wallet> {
    return this.apiService.post<Wallet>('wallets', wallet);
  }

  /**
   * Top up wallet
   */
  topUpWallet(topUpData: {
    walletNumber: string;
    amount: number;
  }): Observable<Transaction> {
    return this.apiService.post<Transaction>('wallets/topup', topUpData);
  }

  /**
   * Add money to wallet from payment method
   */
  addMoney(amount: number, paymentMethodId: number): Observable<any> {
    return this.apiService.post<any>('wallets/deposit', {
      amount,
      paymentMethodId,
    });
  }

  /**
   * Withdraw money from wallet to payment method
   */
  withdraw(amount: number, paymentMethodId: number): Observable<any> {
    return this.apiService.post<any>('wallets/withdraw', {
      amount,
      paymentMethodId,
    });
  }

  /**
   * Transfer money between wallets
   */
  transferMoney(transferData: {
    sourceWalletId: number;
    destinationWalletNumber: string;
    amount: number;
    description?: string;
  }): Observable<Transaction> {
    return this.apiService.post<Transaction>(
      'transactions/transfer',
      transferData
    );
  }

  /**
   * Get payment methods for current user
   */
  getPaymentMethods(): Observable<any[]> {
    return this.apiService.get<any[]>('payment-methods');
  }

  /**
   * Add new payment method
   */
  addPaymentMethod(paymentMethod: any): Observable<any> {
    return this.apiService.post<any>('payment-methods', paymentMethod);
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(id: number): Observable<void> {
    return this.apiService.delete<void>(`payment-methods/${id}`);
  }
}
