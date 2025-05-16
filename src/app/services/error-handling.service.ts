import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handle HTTP errors and show appropriate messages
   */
  handleApiError(
    error: HttpErrorResponse,
    context: string = 'operation'
  ): void {
    let errorMessage = `Error during ${context}`;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = 'Invalid request. Please check your data.';
          }
          break;
        case 401:
          errorMessage = 'Authentication required. Please login again.';
          break;
        case 403:
          errorMessage = "You don't have permission to perform this action.";
          break;
        case 404:
          // Check if it's a wallet related error
          if (error.error?.message?.includes('Wallet not found')) {
            errorMessage = 'Wallet not found or invalid wallet number.';
          } else if (context.toLowerCase().includes('qr')) {
            errorMessage = 'QR code not found or expired.';
          } else if (context.toLowerCase().includes('payment')) {
            errorMessage = 'Payment information not found. Please try again.';
          } else {
            errorMessage = 'Resource not found.';
          }
          break;
        case 409:
          errorMessage = 'Conflict with existing data.';
          break;
        case 422:
          if (error.error?.message?.includes('Insufficient balance')) {
            errorMessage =
              'Insufficient funds in your wallet for this transaction.';
          } else if (error.error?.message?.includes('QR code')) {
            errorMessage = 'This QR code is invalid, expired, or already used.';
          } else {
            errorMessage = error.error?.message || 'Invalid transaction data';
          }
          break;
        case 500:
          if (
            context.toLowerCase().includes('payment') ||
            context.toLowerCase().includes('transaction')
          ) {
            errorMessage = 'Transaction failed. Please try again later.';
          } else {
            errorMessage = 'Server error. Please try again later.';
          }
          break;
        default:
          errorMessage = `Error (${error.status}): ${
            error.error?.message || 'Unknown error'
          }`;
          break;
      }
    }

    this.showErrorMessage(errorMessage);
    console.error('API Error:', error);
  }

  /**
   * Show error message in snackbar
   */
  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['bg-red-100', 'text-red-800'],
    });
  }

  /**
   * Show success message in snackbar
   */
  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['bg-green-100', 'text-green-800'],
    });
  }
}
