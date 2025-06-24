import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
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

import { WalletStore } from '../../stores/wallet.store';
import { TransactionStore } from '../../stores/transaction.store';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Wallet } from '../../models/wallet.model';
import { Transaction, TransactionType } from '../../models/transaction.model';
import {
  PaymentMethod,
  PaymentMethodType,
  AddMoneyRequest,
  WithdrawRequest,
  CreatePaymentMethodRequest,
} from '../../models/payment.model';

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
export class WalletComponent implements OnInit {
  private walletStore = inject(WalletStore);
  private transactionStore = inject(TransactionStore);
  private errorHandler = inject(ErrorHandlingService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('addMoneyDialogTmpl') addMoneyDialogTmpl!: TemplateRef<AddMoneyRequest>;
  @ViewChild('withdrawDialogTmpl') withdrawDialogTmpl!: TemplateRef<WithdrawRequest>;
  @ViewChild('addPaymentMethodDialogTmpl')
  addPaymentMethodDialogTmpl!: TemplateRef<CreatePaymentMethodRequest>;

  // Get signals from stores
  wallet = this.walletStore.wallet;
  paymentMethods = this.walletStore.paymentMethods;
  loading = this.walletStore.isLoading;
  isProcessing = this.walletStore.isProcessing;

  transactions = this.transactionStore.recentTransactions;

  // Computed monthly stats from transactions
  monthlyStats = computed(() => {
    const trans = this.transactions();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTrans = trans.filter(t => {
      if (!t.createdAt) return false;
      const transDate = new Date(t.createdAt);
      return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });

    return {
      spent: monthlyTrans
        .filter(t => t.type === TransactionType.WITHDRAWAL || t.type === TransactionType.PAYMENT)
        .reduce((sum, t) => sum + t.amount, 0),
      received: monthlyTrans
        .filter(t => t.type === TransactionType.DEPOSIT || t.type === TransactionType.RECEIVED)
        .reduce((sum, t) => sum + t.amount, 0),
      count: monthlyTrans.length,
    };
  });

  addMoneyForm!: FormGroup;
  withdrawForm!: FormGroup;
  paymentMethodForm!: FormGroup;

  ngOnInit(): void {
    // Initialize forms
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
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(new Date().getFullYear())]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      holderName: ['', Validators.required],
    });

    // Load data from stores
    this.loadData();
  }
  private loadData(): void {
    this.walletStore.loadWallet();
    this.walletStore.loadPaymentMethods();
    this.transactionStore.loadRecentTransactions({ limit: 10 });
  }

  loadWallet(): void {
    this.loadData();
  }

  openAddMoneyDialog(): void {
    this.dialog.open(this.addMoneyDialogTmpl, {
      width: '400px',
    });
  }

  openWithdrawDialog(): void {
    this.dialog.open(this.withdrawDialogTmpl, {
      width: '400px',
    });
  }

  openAddPaymentMethodDialog(): void {
    this.dialog.open(this.addPaymentMethodDialogTmpl, {
      width: '400px',
    });
  }

  onAddMoney(): void {
    if (this.addMoneyForm.valid) {
      const { amount, paymentMethodId } = this.addMoneyForm.value;
      this.walletStore.addMoney({
        amount: Number(amount),
        paymentMethodId: Number(paymentMethodId),
      });
      this.addMoneyForm.reset();
      this.dialog.closeAll();
    }
  }

  onWithdraw(): void {
    if (this.withdrawForm.valid) {
      const { amount, paymentMethodId } = this.withdrawForm.value;
      this.walletStore.withdraw({
        amount: Number(amount),
        paymentMethodId: Number(paymentMethodId),
      });
      this.withdrawForm.reset();
      this.dialog.closeAll();
    }
  }
  onAddPaymentMethod(): void {
    if (this.paymentMethodForm.valid) {
      const formValue = this.paymentMethodForm.value;
      const paymentMethod: CreatePaymentMethodRequest = {
        type: formValue.type,
        provider: 'Default Provider',
        accountNumber: formValue.cardNumber,
        expiryDate: `${formValue.expiryMonth}/${formValue.expiryYear}`,
      };
      this.walletStore.addPaymentMethod(paymentMethod);
      this.paymentMethodForm.reset();
      this.dialog.closeAll();
    }
  }

  onRemovePaymentMethod(id: number): void {
    this.walletStore.removePaymentMethod(id);
  }

  onRefresh(): void {
    this.loadData();
  }
}
