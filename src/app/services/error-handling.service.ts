import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorDetails } from '../models/http.model';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handle HTTP errors and show appropriate messages
   */
  handleApiError(error: HttpErrorResponse | Error | unknown, operation: string): void {
    const errorDetails = this.categorizeError(error);
    console.error(`Error during ${operation}:`, errorDetails);
    this.showErrorMessage(errorDetails.message);
  }

  /**
   * Categorize errors based on type and status
   */
  categorizeError(error: HttpErrorResponse | Error | unknown): ErrorDetails {
    if (error instanceof HttpErrorResponse) {
      if (!navigator.onLine) {
        return {
          category: 'network',
          message: 'Please check your internet connection and try again',
          technical: 'Network offline',
        };
      }

      if (error.status === 0) {
        return {
          category: 'network',
          message: 'Unable to connect to the server. Please try again later',
          technical: `Status: ${error.status}, Message: ${error.message}`,
        };
      }

      if (error.status === 401) {
        return {
          category: 'client',
          message: 'Your session has expired. Please log in again',
          technical: `Status: ${error.status}, Message: ${error.message}`,
        };
      }

      if (error.status === 403) {
        return {
          category: 'client',
          message: 'You do not have permission to perform this action',
          technical: `Status: ${error.status}, Message: ${error.message}`,
        };
      }

      if (error.status === 422 || error.status === 400) {
        return {
          category: 'client',
          message: this.extractValidationMessage(error) || 'Please check your input and try again',
          technical: `Status: ${error.status}, Message: ${JSON.stringify(error.error)}`,
        };
      }

      if (error.status >= 500) {
        return {
          category: 'server',
          message: 'The server encountered an error. Please try again later',
          technical: `Status: ${error.status}, Message: ${error.message}`,
        };
      }
    }

    return {
      category: 'unknown',
      message: 'An unexpected error occurred. Please try again',
      technical: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  private extractValidationMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors
        .map((e: { message: string } | string) => (typeof e === 'string' ? e : e.message || e))
        .join(', ');
    }

    return '';
  }
  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 8000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
