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
  handleApiError(error: any, action: string = 'performing action'): void {
    console.error(`API Error:`, error);

    let errorMessage = 'An unexpected error occurred. Please try again later.';

    if (error instanceof HttpErrorResponse) {
      // Check for server error (500)
      if (error.status === 500) {
        console.error(`Server error details:`, error.error);

        // For QR code specific errors, try to parse the error message
        if (action.includes('QR code') && error.error?.error) {
          errorMessage = `Error with QR code: ${error.error.error}`;
        } else {
          errorMessage =
            'The server encountered an error. Our team has been notified.';
        }
      }
      // Authentication error (401)
      else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
      }
      // Forbidden (403)
      else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      // Not found (404)
      else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      }
      // Bad request (400)
      else if (error.status === 400 && error.error?.error) {
        errorMessage =
          error.error.error ||
          'Invalid request. Please check your data and try again.';
      }
    }

    this.snackBar.open(`Error ${action}: ${errorMessage}`, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Show a success message to the user
   */
  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show an error message to the user
   */
  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
