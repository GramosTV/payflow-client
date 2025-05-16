import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { WalletService } from '../../services/wallet.service';
import { TransactionService } from '../../services/transaction.service';
import { Wallet } from '../../models/wallet.model';
import { Transaction } from '../../models/transaction.model';
import { forkJoin } from 'rxjs';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'CARD' | 'BANK_ACCOUNT';
  lastFourDigits: string;
}

interface MonthlyStats {
  spent: number;
  received: number;
  count: number;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
})
export class WalletComponent implements OnInit {
  @ViewChild('addMoneyDialogTmpl') addMoneyDialogTmpl!: TemplateRef<any>;
  @ViewChild('withdrawDialogTmpl') withdrawDialogTmpl!: TemplateRef<any>;
  @ViewChild('addPaymentMethodDialogTmpl')
  addPaymentMethodDialogTmpl!: TemplateRef<any>;

  loading: boolean = true;
  isProcessing: boolean = false;
  wallet: Wallet | null = null;
  transactions: Transaction[] = [];
  paymentMethods: PaymentMethod[] = [];
  monthlyStats: MonthlyStats = { spent: 0, received: 0, count: 0 };

  addMoneyForm: FormGroup;
  withdrawForm: FormGroup;
  paymentMethodForm: FormGroup;

  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.addMoneyForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMethodId: ['', Validators.required],
    });

    this.withdrawForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMethodId: ['', Validators.required],
    });

    this.paymentMethodForm = this.formBuilder.group({
      type: ['CARD', Validators.required],
      name: ['', Validators.required],
      cardNumber: ['', [Validators.pattern(/^[0-9]{13,19}$/)]],
      expiryDate: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cvv: ['', [Validators.pattern(/^[0-9]{3,4}$/)]],
      accountNumber: [''],
      routingNumber: [''],
    });
  }

  ngOnInit(): void {
    this.loadWalletData();

    // Add validators conditionally based on payment method type
    this.paymentMethodForm.get('type')?.valueChanges.subscribe((type) => {
      const cardNumberControl = this.paymentMethodForm.get('cardNumber');
      const expiryDateControl = this.paymentMethodForm.get('expiryDate');
      const cvvControl = this.paymentMethodForm.get('cvv');
      const accountNumberControl = this.paymentMethodForm.get('accountNumber');
      const routingNumberControl = this.paymentMethodForm.get('routingNumber');

      if (type === 'CARD') {
        cardNumberControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{13,19}$/),
        ]);
        expiryDateControl?.setValidators([
          Validators.required,
          Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/),
        ]);
        cvvControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{3,4}$/),
        ]);
        accountNumberControl?.clearValidators();
        routingNumberControl?.clearValidators();
      } else {
        cardNumberControl?.clearValidators();
        expiryDateControl?.clearValidators();
        cvvControl?.clearValidators();
        accountNumberControl?.setValidators([Validators.required]);
        routingNumberControl?.setValidators([Validators.required]);
      }

      cardNumberControl?.updateValueAndValidity();
      expiryDateControl?.updateValueAndValidity();
      cvvControl?.updateValueAndValidity();
      accountNumberControl?.updateValueAndValidity();
      routingNumberControl?.updateValueAndValidity();
    });
  }

  loadWalletData(): void {
    this.loading = true;
    forkJoin({
      wallet: this.walletService.getWallet(),
      transactions: this.transactionService.getTransactions(10),
      methods: this.walletService.getPaymentMethods(),
    }).subscribe({
      next: (result) => {
        this.wallet = result.wallet;
        this.transactions = result.transactions;
        this.paymentMethods = result.methods;
        this.calculateMonthlyStats(result.transactions);
        this.loading = false;

        // Update max amount for withdraw form
        if (this.wallet) {
          this.withdrawForm
            .get('amount')
            ?.setValidators([
              Validators.required,
              Validators.min(0.01),
              Validators.max(this.wallet.balance),
            ]);
          this.withdrawForm.get('amount')?.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error('Error loading wallet data', error);
        this.loading = false;
        this.showErrorMessage('Failed to load wallet data');
      },
    });
  }

  loadWallet(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.showSuccessMessage('Wallet balance updated');
      },
      error: (error) => {
        console.error('Error refreshing wallet', error);
        this.showErrorMessage('Failed to refresh wallet balance');
      },
    });
  }

  calculateMonthlyStats(transactions: Transaction[]): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = transactions.filter((t) =>
      t.timestamp ? new Date(t.timestamp) >= startOfMonth : false
    );

    this.monthlyStats.count = monthlyTransactions.length;
    this.monthlyStats.spent = monthlyTransactions
      .filter((t) => t.type === 'WITHDRAWAL' || t.type === 'SENT')
      .reduce((sum, t) => sum + t.amount, 0);

    this.monthlyStats.received = monthlyTransactions
      .filter((t) => t.type === 'DEPOSIT' || t.type === 'RECEIVED')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  openAddMoneyDialog(): void {
    if (this.paymentMethods.length === 0) {
      this.openAddPaymentMethodDialog();
      return;
    }

    this.addMoneyForm.reset({
      amount: '',
      paymentMethodId: this.paymentMethods[0].id,
    });

    this.dialog.open(this.addMoneyDialogTmpl);
  }

  openWithdrawDialog(): void {
    if (this.paymentMethods.length === 0) {
      this.openAddPaymentMethodDialog();
      return;
    }

    this.withdrawForm.reset({
      amount: '',
      paymentMethodId: this.paymentMethods[0].id,
    });

    this.dialog.open(this.withdrawDialogTmpl);
  }

  openAddPaymentMethodDialog(): void {
    this.paymentMethodForm.reset({
      type: 'CARD',
      name: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      accountNumber: '',
      routingNumber: '',
    });

    this.dialog.open(this.addPaymentMethodDialogTmpl);
  }

  addMoney(): void {
    if (this.addMoneyForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const { amount, paymentMethodId } = this.addMoneyForm.value;

    this.walletService.addMoney(amount, paymentMethodId).subscribe({
      next: (result) => {
        this.isProcessing = false;
        this.dialog.closeAll();
        this.wallet = result;
        this.loadWalletData();
        this.showSuccessMessage(`$${amount} added to your wallet`);
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error adding money', error);
        this.showErrorMessage('Failed to add money to wallet');
      },
    });
  }

  withdraw(): void {
    if (this.withdrawForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const { amount, paymentMethodId } = this.withdrawForm.value;

    this.walletService.withdraw(amount, paymentMethodId).subscribe({
      next: (result) => {
        this.isProcessing = false;
        this.dialog.closeAll();
        this.wallet = result;
        this.loadWalletData();
        this.showSuccessMessage(`$${amount} withdrawn from your wallet`);
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error withdrawing money', error);
        this.showErrorMessage(error.message || 'Failed to withdraw money');
      },
    });
  }

  addPaymentMethod(): void {
    if (this.paymentMethodForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const formValue = this.paymentMethodForm.value;

    this.walletService.addPaymentMethod(formValue).subscribe({
      next: (result) => {
        this.isProcessing = false;
        this.dialog.closeAll();
        this.paymentMethods.push(result);
        this.showSuccessMessage('Payment method added successfully');
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error adding payment method', error);
        this.showErrorMessage(error.message || 'Failed to add payment method');
      },
    });
  }
  removePaymentMethod(id: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.walletService.removePaymentMethod(Number(id)).subscribe({
        next: () => {
          this.paymentMethods = this.paymentMethods.filter((m) => m.id !== id);
          this.showSuccessMessage('Payment method removed');
        },
        error: (error) => {
          console.error('Error removing payment method', error);
          this.showErrorMessage('Failed to remove payment method');
        },
      });
    }
  }

  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['bg-green-100', 'text-green-800'],
    });
  }

  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['bg-red-100', 'text-red-800'],
    });
  }
}
