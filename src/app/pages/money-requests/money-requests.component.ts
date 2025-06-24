import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MoneyRequestService } from '../../services/money-request.service';
import { WalletService } from '../../services/wallet.service';
import { MoneyRequest, RequestStatus } from '../../models/money-request.model';
import { Wallet } from '../../models/wallet.model';
import { PaymentMethod, PaymentMethodType } from '../../models/payment.model';

@Component({
  selector: 'app-money-requests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './money-requests.component.html',
  styleUrl: './money-requests.component.scss',
})
export class MoneyRequestsComponent implements OnInit {
  @ViewChild('paymentDialogTmpl') paymentDialogTmpl!: TemplateRef<MoneyRequest>;

  private moneyRequestService = inject(MoneyRequestService);
  private walletService = inject(WalletService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private formBuilder = inject(FormBuilder);
  // Expose enums for template use
  public readonly RequestStatus = RequestStatus;
  public readonly PaymentMethodType = PaymentMethodType;

  requestForm: FormGroup;
  paymentMethodControl = new FormControl(PaymentMethodType.WALLET);

  // Signals for state management
  selectedRequest = signal<MoneyRequest | null>(null);
  filterStatus = signal<string>('All');
  isProcessing = signal<boolean>(false);
  paymentProcessing = signal<boolean>(false);

  // Computed values from service signals
  incomingRequests = computed(() => this.moneyRequestService.incomingRequests());
  outgoingRequests = computed(() => this.moneyRequestService.outgoingRequests());
  loadingIncoming = computed(() => this.moneyRequestService.isLoading());
  loadingOutgoing = computed(() => this.moneyRequestService.isLoading());
  wallet = computed(() => this.walletService.wallet());
  walletBalance = computed(() => this.wallet()?.balance || 0);
  paymentMethods = computed(() => this.walletService.paymentMethods());

  // Computed filtered requests
  filteredIncomingRequests = computed(() => {
    const requests = this.incomingRequests();
    const filter = this.filterStatus();

    if (filter === 'All') {
      return requests;
    }

    const statusMap: Record<string, RequestStatus> = {
      Pending: RequestStatus.PENDING,
      Completed: RequestStatus.COMPLETED,
      Rejected: RequestStatus.REJECTED,
      Expired: RequestStatus.EXPIRED,
    };

    const statusEnum = statusMap[filter];
    return statusEnum ? requests.filter(r => r.status === statusEnum) : requests;
  });

  constructor() {
    this.requestForm = this.formBuilder.group({
      requesteeEmail: ['', [Validators.required, Validators.email]],
      walletNumber: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadIncomingRequests();
    this.loadOutgoingRequests();
    this.loadWalletData();
  }
  loadIncomingRequests(): void {
    this.moneyRequestService.loadIncomingRequests();
  }

  loadOutgoingRequests(): void {
    this.moneyRequestService.loadOutgoingRequests();
  }

  loadWalletData(): void {
    this.walletService.loadWallet();
    this.walletService.loadPaymentMethods();
  }

  // Helper methods for template status checking
  isPendingStatus(status: RequestStatus | string): boolean {
    return status === RequestStatus.PENDING || status === 'PENDING';
  }

  isCompletedStatus(status: RequestStatus | string): boolean {
    return status === RequestStatus.COMPLETED || status === 'COMPLETED';
  }

  isRejectedOrExpiredStatus(status: RequestStatus | string): boolean {
    return (
      status === RequestStatus.REJECTED ||
      status === RequestStatus.EXPIRED ||
      status === 'REJECTED' ||
      status === 'EXPIRED'
    );
  }

  isNotPendingStatus(status: RequestStatus | string): boolean {
    return !this.isPendingStatus(status);
  }

  filterRequests(status: string): void {
    this.filterStatus.set(status);
  }

  createMoneyRequest(): void {
    if (this.requestForm.invalid) {
      Object.values(this.requestForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.snackBar.open('Please correct the errors in the form.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isProcessing.set(true);
    const formValue = this.requestForm.value;

    const requestData = {
      requesteeEmail: formValue.requesteeEmail,
      walletNumber: formValue.walletNumber,
      amount: formValue.amount,
      description: formValue.description,
    };

    this.moneyRequestService.createMoneyRequest(requestData);

    // Watch for completion
    effect(() => {
      if (!this.moneyRequestService.isLoading()) {
        this.isProcessing.set(false);
        const error = this.moneyRequestService.error();
        if (error) {
          this.showErrorMessage(error);
        } else {
          this.snackBar.open('Money request created successfully!', 'Close', {
            duration: 3000,
          });
          this.requestForm.reset();
          this.loadOutgoingRequests();
        }
      }
    });
  }

  payRequest(request: MoneyRequest): void {
    this.selectedRequest.set(request);
    this.paymentMethodControl.setValue(PaymentMethodType.WALLET);
    this.dialog.open(this.paymentDialogTmpl, {
      width: '400px',
    });
  }

  confirmPayment(): void {
    const selectedRequest = this.selectedRequest();
    if (!selectedRequest || !selectedRequest.id) {
      return;
    }

    this.paymentProcessing.set(true);
    const paymentMethod = this.paymentMethodControl.value;

    this.moneyRequestService.payMoneyRequest(selectedRequest.id, Number(paymentMethod));

    // Watch for completion
    effect(() => {
      if (!this.moneyRequestService.isLoading()) {
        this.paymentProcessing.set(false);
        const error = this.moneyRequestService.error();
        if (error) {
          this.showErrorMessage(error);
        } else {
          this.dialog.closeAll();
          this.loadIncomingRequests();
          this.loadWalletData();
          this.showSuccessMessage(`Payment of ${selectedRequest.amount} completed successfully`);
          this.selectedRequest.set(null);
        }
      }
    });
  }

  rejectRequest(requestId: number | undefined): void {
    if (!requestId) return;

    if (confirm('Are you sure you want to reject this money request?')) {
      this.moneyRequestService.rejectMoneyRequest(requestId);

      // Watch for completion
      effect(() => {
        if (!this.moneyRequestService.isLoading()) {
          const error = this.moneyRequestService.error();
          if (error) {
            this.showErrorMessage('Failed to reject money request');
          } else {
            this.loadIncomingRequests();
            this.showSuccessMessage('Money request rejected');
          }
        }
      });
    }
  }

  cancelRequest(requestId: number | undefined): void {
    if (!requestId) return;

    if (confirm('Are you sure you want to cancel this money request?')) {
      this.moneyRequestService.cancelMoneyRequest(requestId);

      // Watch for completion
      effect(() => {
        if (!this.moneyRequestService.isLoading()) {
          const error = this.moneyRequestService.error();
          if (error) {
            this.showErrorMessage('Failed to cancel money request');
          } else {
            this.loadOutgoingRequests();
            this.showSuccessMessage('Money request cancelled');
          }
        }
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
