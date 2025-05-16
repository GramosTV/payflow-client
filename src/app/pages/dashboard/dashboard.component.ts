import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { WalletService } from '../../services/wallet.service';
import { TransactionService } from '../../services/transaction.service';
import { MoneyRequestService } from '../../services/money-request.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';

import { Wallet } from '../../models/wallet.model';
import { Transaction } from '../../models/transaction.model';
import { MoneyRequest } from '../../models/money-request.model';
import { ExchangeRate } from '../../models/exchange-rate.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  loading: boolean = true;
  wallet: Wallet | null = null;
  recentTransactions: Transaction[] = [];
  pendingRequests: MoneyRequest[] = [];
  exchangeRates: ExchangeRate[] = [];

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private moneyRequestService: MoneyRequestService,
    private exchangeRateService: ExchangeRateService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      wallet: this.walletService.getWallet(),
      transactions: this.transactionService.getRecentTransactions(5),
      requests: this.moneyRequestService.getPendingRequests(),
      rates: this.exchangeRateService.getExchangeRates(),
    }).subscribe({
      next: (result) => {
        this.wallet = result.wallet;
        this.recentTransactions = result.transactions;
        this.pendingRequests = result.requests;
        this.exchangeRates = result.rates;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.loading = false;
      },
    });
  }
}
