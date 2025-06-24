import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WalletStore } from '../../stores/wallet.store';
import { TransactionStore } from '../../stores/transaction.store';
import { MoneyRequestStore } from '../../stores/money-request.store';
import { ExchangeRateService } from '../../services/exchange-rate.service';

import { Wallet } from '../../models/wallet.model';
import { Transaction, TransactionType } from '../../models/transaction.model';
import { MoneyRequest } from '../../models/money-request.model';
import { ExchangeRate } from '../../models/exchange-rate.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private walletStore = inject(WalletStore);
  private transactionStore = inject(TransactionStore);
  private moneyRequestStore = inject(MoneyRequestStore);
  private exchangeRateService = inject(ExchangeRateService);
  // Expose enums for template use
  readonly TransactionType = TransactionType;

  // Get signals from stores
  wallet = this.walletStore.wallet;
  recentTransactions = this.transactionStore.recentTransactions;
  pendingRequests = this.moneyRequestStore.pendingRequests;
  loading = this.walletStore.isLoading;

  exchangeRates: ExchangeRate[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load data from stores
    this.walletStore.loadWallet();
    this.transactionStore.loadRecentTransactions({ limit: 5 });
    this.moneyRequestStore.loadPendingRequests();

    // Load exchange rates (still using service as it's not migrated)
    this.exchangeRateService.getExchangeRates().subscribe({
      next: rates => {
        this.exchangeRates = rates;
      },
      error: error => {
        console.error('Error loading exchange rates:', error);
      },
    });
  }
}
