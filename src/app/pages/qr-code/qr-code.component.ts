import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
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

interface ScanResult {
  userId: string;
  userName: string;
  amount?: number;
  description?: string;
  expirationTime?: Date;
  qrCodeId: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  lastFourDigits: string;
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
export class QrCodeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  qrCodeForm: FormGroup;

  qrCodeData: string | undefined = undefined;
  generatingQR = false;
  generatedAmount?: number;
  generatedDescription?: string;
  expirationTime?: Date;

  isScanning = false;
  scanActive = false;
  scanResult: ScanResult | null = null;
  walletBalance = 0;
  wallet: any = null; // Add wallet property
  paymentMethods: PaymentMethod[] = [];
  paymentMethodId = 'WALLET'; // Default payment method
  paymentAmount: number | null = null;
  customAmount?: number;
  processingPayment = false;
  videoStream: MediaStream | null = null;
  scanInterval: any = null;
  isLoadingQrImage = false;
  qrCodeImageError: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private qrCodeService: QRCodeService,
    private walletService: WalletService,
    private snackBar: MatSnackBar,
    private scannerService: ScannerService,
    private errorHandler: ErrorHandlingService
  ) {
    this.qrCodeForm = this.formBuilder.group({
      amount: ['', [Validators.min(0.01)]],
      description: [''],
      expiration: ['30'], // Default 30 minutes
    });
  }

  ngOnInit(): void {
    this.loadWalletData();
  }

  ngAfterViewInit(): void {
    // Initialize camera if available
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }
  loadWalletData(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.walletBalance = wallet.balance;
      },
      error: (error) => {
        this.errorHandler.handleApiError(error, 'loading wallet data');
      },
    });

    this.walletService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
      },
      error: (error) => {
        this.errorHandler.handleApiError(error, 'loading payment methods');
      },
    });
  }
  generateQRCode(): void {
    if (this.qrCodeForm.invalid) {
      return;
    }

    this.generatingQR = true;
    const { amount, description, expiration } = this.qrCodeForm.value;
    this.qrCodeService
      .generatePaymentQRCode({
        walletNumber: this.wallet?.walletNumber,
        amount: amount || undefined,
        description: description || undefined,
        expirationMinutes: expiration ? parseInt(expiration) : undefined,
      })
      .subscribe({
        next: (response) => {
          // Store the QR code response data
          this.generatedAmount = response.amount;
          this.generatedDescription = response.description;
          this.expirationTime = response.expiresAt
            ? new Date(response.expiresAt)
            : undefined;

          // Get the QR code image from the server with retry logic
          this.loadQrCodeImage(response.id!, 0);
        },
        error: (error) => {
          this.generatingQR = false;
          this.errorHandler.handleApiError(error, 'generating QR code');
        },
      });
  }

  downloadQRCode(): void {
    if (!this.qrCodeData) return;

    const link = document.createElement('a');
    link.href = this.qrCodeData;
    link.download = `payflow-qr-${new Date().getTime()}.png`;
    link.click();
  }

  shareQRCode(): void {
    if (!this.qrCodeData || !navigator.share) {
      this.errorHandler.showErrorMessage(
        'Sharing is not supported on this device'
      );
      return;
    }

    // Convert base64 to blob for sharing
    fetch(this.qrCodeData)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'payflow-qr.png', { type: 'image/png' });

        navigator
          .share({
            title: 'PayFlow Payment QR Code',
            text: this.generatedDescription || 'Scan to pay with PayFlow',
            files: [file],
          })
          .catch((error) => {
            console.error('Error sharing QR code', error);
            this.errorHandler.showErrorMessage('Error sharing QR code');
          });
      });
  }

  startScanning(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorHandler.showErrorMessage(
        'Camera access is not supported in your browser'
      );
      return;
    }

    // Using our custom scanner service instead of direct media device access
    if (this.videoElement && this.canvasElement) {
      this.scannerService
        .startScanner(
          this.videoElement.nativeElement,
          this.canvasElement.nativeElement
        )
        .then((success) => {
          if (success) {
            this.isScanning = true;

            // Subscribe to scan results
            this.scannerService.scanResult$.subscribe((result) => {
              if (result) {
                this.processScanResult(result);
              }
            });
          } else {
            this.errorHandler.showErrorMessage('Failed to start scanner');
          }
        })
        .catch((error) => {
          console.error('Error accessing camera', error);
          this.errorHandler.showErrorMessage('Failed to access camera');
        });
    } else {
      this.errorHandler.showErrorMessage('Scanner elements not initialized');
    }
  }
  stopScanning(): void {
    this.scannerService.stopScanner();
    this.isScanning = false;
  }

  private processScanResult(qrContent: string): void {
    const parsedQr = this.scannerService.parsePayFlowQrCode(qrContent);
    if (parsedQr) {
      this.stopScanning();

      this.scanResult = {
        qrCodeId: parsedQr.qrId,
        userName: parsedQr.walletNumber || 'Unknown User', // In a real app, you would fetch user info
        userId: parsedQr.walletNumber || '',
        amount: parsedQr.amount,
        description: parsedQr.description,
        expirationTime: undefined,
      };

      this.errorHandler.showSuccessMessage('QR code scanned successfully');
    }
  }

  makePayment(): void {
    if (
      !this.scanResult ||
      (this.scanResult.amount === undefined && !this.customAmount)
    ) {
      this.errorHandler.showErrorMessage('Invalid payment details');
      return;
    }

    const paymentAmount = this.scanResult.amount || this.customAmount;

    // Check wallet balance if using wallet
    if (
      this.paymentMethodId === 'WALLET' &&
      this.walletBalance < paymentAmount!
    ) {
      this.errorHandler.showErrorMessage('Insufficient wallet balance');
      return;
    }
    this.processingPayment = true;
    this.qrCodeService
      .processQRCodePayment({
        qrCodeId: this.scanResult.qrCodeId,
        amount: paymentAmount,
        paymentMethodId:
          this.paymentMethodId === 'WALLET' ? undefined : this.paymentMethodId,
        sourceWalletNumber: this.wallet?.walletNumber,
      })
      .subscribe({
        next: () => {
          this.processingPayment = false;
          this.errorHandler.showSuccessMessage(
            `Payment of ${paymentAmount} to ${this.scanResult?.userName} was successful`
          );
          this.cancelPayment();
          this.loadWalletData();
        },
        error: (error) => {
          this.processingPayment = false;
          this.errorHandler.handleApiError(error, 'processing payment');
        },
      });
  }
  cancelPayment(): void {
    this.scanResult = null;
    this.customAmount = undefined;
    this.paymentMethodId = 'WALLET';
  }

  /**
   * Load QR code image with retry logic
   * This helps handle potential LazyInitializationException on the server
   */
  private loadQrCodeImage(
    qrCodeId: number,
    retryCount: number = 0,
    maxRetries: number = 3,
    delay: number = 1000
  ): void {
    if (this.isLoadingQrImage) return;

    this.isLoadingQrImage = true;
    this.qrCodeImageError = null;

    this.qrCodeService.getQRCodeImageById(qrCodeId).subscribe({
      next: (imageData) => {
        this.qrCodeData = imageData;
        this.isLoadingQrImage = false;
      },
      error: (error) => {
        console.error(
          `Error loading QR code image (attempt ${retryCount + 1}):`,
          error
        );
        this.isLoadingQrImage = false;

        // If we haven't reached max retries, try again after delay
        if (retryCount < maxRetries) {
          this.qrCodeImageError = `Loading image (retry ${
            retryCount + 1
          }/${maxRetries})...`;
          setTimeout(() => {
            this.loadQrCodeImage(qrCodeId, retryCount + 1, maxRetries, delay);
          }, delay);
        } else {
          this.qrCodeImageError =
            'Failed to load QR code image. Please try again.';
          this.errorHandler.showErrorMessage(
            'Could not load QR code image after multiple attempts. Server may be busy.'
          );
        }
      },
    });
  }
}
