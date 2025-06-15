import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface QRCodeResult {
  qrId: string;
  walletNumber?: string;
  currency?: string;
  amount?: number;
  isAmountFixed?: boolean;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private scannerEnabled = false;
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  private scanResultSubject = new BehaviorSubject<string | null>(null);
  public scanResult$ = this.scanResultSubject.asObservable();

  /**
   * Start the scanner with the provided video element
   */
  public startScanner(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasContext = canvasElement.getContext('2d');

    return this.startCamera()
      .then(() => {
        this.scannerEnabled = true;
        this.startScanningLoop();
        return true;
      })
      .catch(error => {
        console.error('Failed to start scanner:', error);
        return false;
      });
  }

  /**
   * Stop the scanner
   */
  public stopScanner(): void {
    this.scannerEnabled = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Start the camera
   */
  private startCamera(): Promise<void> {
    if (!this.videoElement) {
      return Promise.reject('Video element not set');
    }

    const constraints = {
      video: {
        facingMode: 'environment',
      },
    };

    return navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      this.videoElement!.srcObject = stream;
      return new Promise<void>(resolve => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          resolve();
        };
      });
    });
  }

  /**
   * Start scanning loop
   */
  private startScanningLoop(): void {
    this.scanInterval = setInterval(() => {
      this.scanFrame();
    }, 500); // Scan every 500ms
  }

  /**
   * Scan a single frame from the video
   */
  private scanFrame(): void {
    if (!this.scannerEnabled || !this.videoElement || !this.canvasElement || !this.canvasContext) {
      return;
    }

    // In a real application, we would use a library like jsQR here
    // For this demo, we'll simulate finding a QR code randomly
    if (Math.random() > 0.8) {
      // Simulate a QR code found - in a real app, this would decode the actual QR content
      this.processQrCodeContent(
        'payflow://payment?qr_id=QR-' + Math.random().toString(36).substring(2, 10)
      );
    }
  }

  /**
   * Process QR code content
   */
  private processQrCodeContent(content: string): void {
    this.scanResultSubject.next(content);
  }

  /**
   * Clear the current scan result
   */
  public clearScanResult(): void {
    this.scanResultSubject.next(null);
  }

  /**
   * Parse a PayFlow QR code URL
   */
  public parsePayFlowQrCode(qrContent: string): {
    qrId: string;
    walletNumber?: string;
    currency?: string;
    amount?: number;
    description?: string;
  } | null {
    try {
      // Expected format: payflow://payment?qr_id=X&wallet=Y&currency=Z&amount=N&description=D
      if (!qrContent.startsWith('payflow://payment?')) {
        return null;
      }

      const url = new URL(qrContent.replace('payflow://', 'https://'));
      const params = new URLSearchParams(url.search);

      const result: QRCodeResult = {
        qrId: params.get('qr_id') || '',
      };

      if (params.has('wallet')) {
        const wallet = params.get('wallet');
        if (wallet) result.walletNumber = wallet;
      }

      if (params.has('currency')) {
        const currency = params.get('currency');
        if (currency) result.currency = currency;
      }

      if (params.has('amount')) {
        const amount = params.get('amount');
        if (amount) result.amount = parseFloat(amount);
      }

      if (params.has('description')) {
        const description = params.get('description');
        if (description) result.description = description;
      }

      return result;
    } catch (error) {
      console.error('Failed to parse QR code content:', error);
      return null;
    }
  }
}
