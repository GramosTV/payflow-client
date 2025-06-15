import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Wallet } from '../../models/wallet.model';
import { Transaction } from '../../models/transaction.model';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('addMoneyDialogTmpl') addMoneyDialogTmpl!: TemplateRef<any>;
  @ViewChild('withdrawDialogTmpl') withdrawDialogTmpl!: TemplateRef<any>;
  @ViewChild('addPaymentMethodDialogTmpl')
  addPaymentMethodDialogTmpl!: TemplateRef<any>;

  loading = true;
  isProcessing = false;
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
    private errorHandler: ErrorHandlingService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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
    this.paymentMethodForm.get('type')?.valueChanges.subscribe(type => {
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
        cvvControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]);
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWalletData(): void {
    this.loading = true;
    forkJoin({
      wallet: this.walletService.getWallet(),
      transactions: this.transactionService.getTransactions(10),
      methods: this.walletService.getPaymentMethods(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.wallet = result.wallet;
          this.transactions = result.transactions;
          this.paymentMethods = result.methods;
          this.calculateMonthlyStats(result.transactions);
          this.loading = false;
          this.cdr.markForCheck();

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
        error: error => {
          this.loading = false;
          this.errorHandler.handleApiError(error, 'loading wallet data');
          this.cdr.markForCheck();
        },
      });
  }

  loadWallet(): void {
    this.walletService
      .getWallet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: wallet => {
          this.cdr.markForCheck();
          this.wallet = wallet;
          this.showSuccessMessage('Wallet balance updated');
        },
        error: error => {
          console.error('Error refreshing wallet', error);
          this.showErrorMessage('Failed to refresh wallet balance');
        },
      });
  }

  calculateMonthlyStats(transactions: Transaction[]): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = transactions.filter(t =>
      t.timestamp ? new Date(t.timestamp) >= startOfMonth : false
    );

    this.monthlyStats.count = monthlyTransactions.length;
    this.monthlyStats.spent = monthlyTransactions
      .filter(t => t.type === 'WITHDRAWAL' || t.type === 'SENT')
      .reduce((sum, t) => sum + t.amount, 0);

    this.monthlyStats.received = monthlyTransactions
      .filter(t => t.type === 'DEPOSIT' || t.type === 'RECEIVED')
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

    this.walletService
      .addMoney(amount, paymentMethodId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.isProcessing = false;
          this.dialog.closeAll();
          this.wallet = result;
          this.loadWalletData();
          this.errorHandler.showSuccessMessage(`$${amount} added to your wallet`);
          this.cdr.markForCheck();
        },
        error: error => {
          this.isProcessing = false;
          this.errorHandler.handleApiError(error, 'adding money');
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
    this.walletService
      .withdraw(amount, paymentMethodId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.isProcessing = false;
          this.dialog.closeAll();
          this.wallet = result;
          this.loadWalletData();
          this.errorHandler.showSuccessMessage(`$${amount} withdrawn from your wallet`);
          this.cdr.markForCheck();
        },
        error: error => {
          this.isProcessing = false;
          this.errorHandler.handleApiError(error, 'withdrawing money');
          this.cdr.markForCheck();
        },
      });
  }
  addPaymentMethod(): void {
    if (this.paymentMethodForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const formValue = this.paymentMethodForm.value;

    this.walletService
      .addPaymentMethod(formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          this.isProcessing = false;
          this.dialog.closeAll();
          this.paymentMethods.push(result);
          this.showSuccessMessage('Payment method added successfully');
          this.cdr.markForCheck();
        },
        error: error => {
          this.isProcessing = false;
          this.errorHandler.handleApiError(error, 'adding payment method');
          this.cdr.markForCheck();
        },
      });
  }
  removePaymentMethod(id: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.walletService
        .removePaymentMethod(Number(id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.paymentMethods = this.paymentMethods.filter(m => m.id !== id);
            this.showSuccessMessage('Payment method removed');
            this.cdr.markForCheck();
          },
          error: error => {
            this.errorHandler.handleApiError(error, 'removing payment method');
            this.cdr.markForCheck();
          },
        });
    }
  }
  showSuccessMessage(message: string): void {
    this.errorHandler.showSuccessMessage(message);
    this.cdr.markForCheck();
  }

  showErrorMessage(message: string): void {
    this.errorHandler.showErrorMessage(message);
    this.cdr.markForCheck();
  }
}
