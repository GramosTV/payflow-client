import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { LoginRequest, SignUpRequest } from '../models/auth.model';
import { ChangePasswordRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  /**
   * Get current user signal
   */
  get currentUser() {
    return this.authStore.currentUser;
  }

  /**
   * Get authentication state signal
   */
  get isAuthenticated() {
    return this.authStore.isAuthenticated;
  }

  /**
   * Get loading state signal
   */
  get isLoading() {
    return this.authStore.isLoading;
  }

  /**
   * Get error state signal
   */
  get error() {
    return this.authStore.error;
  }

  /**
   * Get current user synchronously
   * @returns The current user or null if not logged in
   */
  getCurrentUser() {
    return this.authStore.currentUser();
  }

  /**
   * Check if user is logged in
   * @returns True if user is logged in with a valid token
   */
  isLoggedIn(): boolean {
    return this.authStore.isAuthenticated();
  }

  /**
   * Get auth token
   * @returns The current JWT token or null
   */
  getToken(): string | null {
    return this.authStore.token();
  }

  /**
   * Login user
   * @param email User email
   * @param password User password
   */
  login(email: string, password: string): void {
    const credentials: LoginRequest = { email, password };
    this.authStore.login(credentials);
  }

  /**
   * Register new user
   * @param userData User registration data
   */
  register(userData: SignUpRequest): void {
    this.authStore.register(userData);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Change password
   * @param currentPassword User's current password
   * @param newPassword New password
   */
  changePassword(currentPassword: string, newPassword: string): void {
    const request: ChangePasswordRequest = {
      currentPassword,
      newPassword,
    };
    this.authStore.changePassword(request);
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): void {
    this.authStore.refreshToken();
  }
}
