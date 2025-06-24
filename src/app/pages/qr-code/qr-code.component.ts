import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { QRCodeService } from '../../services/qr-code.service';
import { WalletService } from '../../services/wallet.service';
import { ScannerService } from '../../services/scanner.service';
import { ErrorHandlingService } from '../../services/error-handling.service';
import { Wallet } from '../../models/wallet.model';
import { PaymentMethod, PaymentMethodType } from '../../models/payment.model';

interface ScanResult {
  userId: string;
  userName: string;
  amount?: number;
  description?: string;
  expirationTime?: Date;
  qrCodeId: string;
}

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.scss',
})
export class QrCodeComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private qrCodeService = inject(QRCodeService);
  private walletService = inject(WalletService);
  private snackBar = inject(MatSnackBar);
  private scannerService = inject(ScannerService);
  private errorHandler = inject(ErrorHandlingService);
  private formBuilder = inject(FormBuilder);
  // Expose enums for template use
  public readonly PaymentMethodType = PaymentMethodType;

  qrCodeForm: FormGroup;

  // Signals for state management
  isScanning = signal<boolean>(false);
  scanActive = signal<boolean>(false);
  scanResult = signal<ScanResult | null>(null);
  paymentMethodId = signal<string>(PaymentMethodType.WALLET);
  paymentAmount = signal<number | null>(null);
  customAmount = signal<number | undefined>(undefined);
  processingPayment = signal<boolean>(false);
  videoStream = signal<MediaStream | null>(null);
  scanInterval = signal<ReturnType<typeof setInterval> | null>(null);
  isLoadingQrImage = signal<boolean>(false);
  qrCodeImageError = signal<string | null>(null);
  // Computed values from service signals
  qrCodes = computed(() => this.qrCodeService.qrCodes());
  currentQRCode = computed(() => this.qrCodeService.currentQRCode());
  qrCodeImage = computed(() => this.qrCodeService.qrCodeImage());
  generatingQR = computed(() => this.qrCodeService.isLoading());

  wallet = computed(() => this.walletService.wallet());
  walletBalance = computed(() => this.wallet()?.balance || 0);
  paymentMethods = computed(() => this.walletService.paymentMethods());

  // Scanner result from service
  scannerResult = computed(() => this.scannerService.scanResult());

  constructor() {
    this.qrCodeForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(10000)]],
      description: ['', [Validators.maxLength(200)]],
      expiresInHours: [24, [Validators.required, Validators.min(1), Validators.max(168)]],
    });

    // Effect to handle scanner results
    effect(() => {
      const result = this.scannerResult();
      if (result) {
        this.processScanResult(result);
      }
    });
  }

  ngOnInit(): void {
    this.loadWalletData();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadWalletData(): void {
    this.walletService.loadWallet();
    this.walletService.loadPaymentMethods();
  }

  generateQRCode(): void {
    if (this.qrCodeForm.invalid) {
      this.qrCodeForm.markAllAsTouched();
      return;
    }
    const formValue = this.qrCodeForm.value;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + formValue.expiresInHours);

    this.qrCodeService.createQRCode({
      walletNumber: this.wallet()?.walletNumber || '',
      amount: formValue.amount,
      isAmountFixed: true,
      isOneTime: false,
      description: formValue.description,
      expiresAt: expiresAt,
    });
  }

  async startScanning(): Promise<void> {
    this.isScanning.set(true);
    this.scanActive.set(true);
    this.scanResult.set(null);
    this.qrCodeImageError.set(null);

    try {
      const success = await this.scannerService.startScanner(
        this.videoElement.nativeElement,
        this.canvasElement.nativeElement
      );

      if (!success) {
        throw new Error('Failed to start scanner');
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      this.snackBar.open('Unable to access camera. Please check permissions.', 'Close', {
        duration: 5000,
      });
      this.isScanning.set(false);
      this.scanActive.set(false);
    }
  }

  stopScanning(): void {
    this.scannerService.stopScanner();
    this.isScanning.set(false);
    this.scanActive.set(false);
    this.stopCamera();
  }

  private stopCamera(): void {
    const stream = this.videoStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.videoStream.set(null);
    }
  }

  private processScanResult(result: string): void {
    try {
      const qrData = JSON.parse(result) as ScanResult;
      this.scanResult.set(qrData);
      this.stopScanning();

      if (qrData.amount) {
        this.paymentAmount.set(qrData.amount);
      }
    } catch (error) {
      console.error('Error parsing QR code result:', error);
      this.snackBar.open('Invalid QR code format', 'Close', { duration: 3000 });
    }
  }

  setCustomAmount(): void {
    const customAmt = this.customAmount();
    if (customAmt && customAmt > 0) {
      this.paymentAmount.set(customAmt);
    }
  }

  processPayment(): void {
    const result = this.scanResult();
    const amount = this.paymentAmount();
    const paymentMethod = this.paymentMethodId();

    if (!result || !amount || !paymentMethod) {
      this.snackBar.open('Missing payment information', 'Close', { duration: 3000 });
      return;
    }

    this.processingPayment.set(true);
    this.qrCodeService.payQRCode(result.qrCodeId, amount, Number(paymentMethod));

    // Watch for completion
    effect(() => {
      if (!this.qrCodeService.isLoading()) {
        this.processingPayment.set(false);
        const error = this.qrCodeService.error();
        if (error) {
          this.snackBar.open(`Payment failed: ${error}`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Payment completed successfully!', 'Close', { duration: 3000 });
          this.resetPayment();
        }
      }
    });
  }
  resetPayment(): void {
    this.scanResult.set(null);
    this.paymentAmount.set(null);
    this.customAmount.set(undefined);
    this.paymentMethodId.set(PaymentMethodType.WALLET);
  }

  downloadQRCode(): void {
    const qrImage = this.qrCodeImage();
    if (!qrImage) {
      this.snackBar.open('No QR code to download', 'Close', { duration: 3000 });
      return;
    } // Create download link
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `payflow-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('QR code downloaded successfully!', 'Close', { duration: 3000 });
  }
  clearQRCode(): void {
    this.qrCodeService.clearError();
    this.qrCodeForm.reset({
      amount: '',
      description: '',
      expiresInHours: 24,
    });
  }
}
