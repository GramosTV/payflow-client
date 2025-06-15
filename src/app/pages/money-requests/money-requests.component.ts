import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
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

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  lastFourDigits: string;
}

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
  @ViewChild('paymentDialogTmpl') paymentDialogTmpl!: TemplateRef<any>;

  requestForm: FormGroup;
  paymentMethodControl = new FormControl('WALLET');

  incomingRequests: MoneyRequest[] = [];
  outgoingRequests: MoneyRequest[] = [];
  filteredIncomingRequests: MoneyRequest[] = [];

  selectedRequest: MoneyRequest | null = null;

  loadingIncoming = true;
  loadingOutgoing = true;
  isProcessing = false;
  paymentProcessing = false;

  filterStatus = 'All';
  walletBalance = 0;
  wallet: Wallet | null = null;
  paymentMethods: PaymentMethod[] = [];
  RequestStatus = RequestStatus; // Expose enum to template

  constructor(
    private formBuilder: FormBuilder,
    private moneyRequestService: MoneyRequestService,
    private walletService: WalletService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.requestForm = this.formBuilder.group({
      requesteeEmail: ['', [Validators.required, Validators.email]],
      walletNumber: ['', [Validators.required]], // Added walletNumber field
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
    this.loadingIncoming = true;
    this.moneyRequestService.getIncomingRequests().subscribe({
      next: response => {
        if (response && Array.isArray((response as any).content)) {
          this.incomingRequests = (response as any).content;
          this.filterRequests(this.filterStatus);
        } else if (Array.isArray(response)) {
          this.incomingRequests = response;
          this.filterRequests(this.filterStatus);
        } else {
          console.error(
            'Incoming requests data is not in expected Page format or an array',
            response
          );
          this.incomingRequests = [];
        }
        this.loadingIncoming = false;
      },
      error: error => {
        console.error('Error loading incoming requests', error);
        this.incomingRequests = [];
        this.loadingIncoming = false;
      },
    });
  }

  loadOutgoingRequests(): void {
    this.loadingOutgoing = true;
    this.moneyRequestService.getOutgoingRequests().subscribe({
      next: response => {
        if (response && Array.isArray((response as any).content)) {
          this.outgoingRequests = (response as any).content;
        } else if (Array.isArray(response)) {
          this.outgoingRequests = response;
        } else {
          console.error(
            'Outgoing requests data is not in expected Page format or an array',
            response
          );
          this.outgoingRequests = [];
        }
        this.loadingOutgoing = false;
      },
      error: error => {
        console.error('Error loading outgoing requests', error);
        this.outgoingRequests = [];
        this.loadingOutgoing = false;
      },
    });
  }

  loadWalletData(): void {
    this.walletService.getWallet().subscribe({
      next: wallet => {
        this.wallet = wallet;
        this.walletBalance = wallet.balance;
      },
      error: error => {
        console.error('Error loading wallet data', error);
      },
    });

    this.walletService.getPaymentMethods().subscribe({
      next: methods => {
        this.paymentMethods = methods;
      },
      error: error => {
        console.error('Error loading payment methods', error);
      },
    });
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
    this.filterStatus = status;

    // Check if incomingRequests is defined and is an array
    if (!this.incomingRequests || !Array.isArray(this.incomingRequests)) {
      this.filteredIncomingRequests = [];
      return;
    }

    if (status === 'All') {
      this.filteredIncomingRequests = [...this.incomingRequests];
    } else {
      const statusMap: Record<string, RequestStatus> = {
        Pending: RequestStatus.PENDING,
        Completed: RequestStatus.COMPLETED,
        Rejected: RequestStatus.REJECTED,
        Expired: RequestStatus.EXPIRED,
      };

      const statusEnum = statusMap[status];
      if (statusEnum) {
        this.filteredIncomingRequests = this.incomingRequests.filter(r => r.status === statusEnum);
      }
    }
  }
  createMoneyRequest(): void {
    if (this.requestForm.invalid) {
      // Mark all fields as touched to display validation errors
      Object.values(this.requestForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.snackBar.open('Please correct the errors in the form.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isProcessing = true;
    const formValue = this.requestForm.value;

    const requestData = {
      requesteeEmail: formValue.requesteeEmail,
      walletNumber: formValue.walletNumber, // Using the new form field
      amount: formValue.amount,
      description: formValue.description,
    };

    this.moneyRequestService.createMoneyRequest(requestData).subscribe({
      next: () => {
        this.isProcessing = false;
        this.snackBar.open('Money request created successfully!', 'Close', {
          duration: 3000,
        });
        this.requestForm.reset();
        // Optionally, reload outgoing requests
        this.loadOutgoingRequests();
      },
      error: error => {
        this.isProcessing = false;
        console.error('Error creating money request', error);
        let errorMessage = 'Failed to create money request.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
        });
      },
    });
  }

  payRequest(request: MoneyRequest): void {
    this.selectedRequest = request;
    this.paymentMethodControl.setValue('WALLET');
    this.dialog.open(this.paymentDialogTmpl, {
      width: '400px',
    });
  }
  confirmPayment(): void {
    if (!this.selectedRequest || !this.selectedRequest.id) {
      return;
    }

    this.paymentProcessing = true;
    const paymentMethod = this.paymentMethodControl.value;

    this.moneyRequestService
      .payMoneyRequest(this.selectedRequest.id, Number(paymentMethod))
      .subscribe({
        next: () => {
          this.paymentProcessing = false;
          this.dialog.closeAll();

          // Update request status
          this.loadIncomingRequests();
          this.loadWalletData();

          this.showSuccessMessage(
            `Payment of ${this.selectedRequest?.amount} completed successfully`
          );
          this.selectedRequest = null;
        },
        error: error => {
          this.paymentProcessing = false;
          console.error('Error paying money request', error);
          this.showErrorMessage(error.message || 'Payment failed');
        },
      });
  }
  rejectRequest(requestId: number | undefined): void {
    if (!requestId) return;

    if (confirm('Are you sure you want to reject this money request?')) {
      this.moneyRequestService.rejectMoneyRequest(requestId).subscribe({
        next: () => {
          this.loadIncomingRequests();
          this.showSuccessMessage('Money request rejected');
        },
        error: error => {
          console.error('Error rejecting money request', error);
          this.showErrorMessage('Failed to reject money request');
        },
      });
    }
  }
  cancelRequest(requestId: number | undefined): void {
    if (!requestId) return;

    if (confirm('Are you sure you want to cancel this money request?')) {
      this.moneyRequestService.cancelMoneyRequest(requestId).subscribe({
        next: () => {
          this.loadOutgoingRequests();
          this.showSuccessMessage('Money request cancelled');
        },
        error: error => {
          console.error('Error cancelling money request', error);
          this.showErrorMessage('Failed to cancel money request');
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
