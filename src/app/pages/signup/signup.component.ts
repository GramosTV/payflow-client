import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);

  signupForm!: FormGroup;

  // Signals for state management
  loading = signal<boolean>(false);
  error = signal<string>('');
  hidePassword = signal<boolean>(true);
  hideConfirmPassword = signal<boolean>(true);

  constructor() {
    // Effect to watch for auth state changes
    effect(() => {
      const isLoading = this.authService.isLoading();
      this.loading.set(isLoading);

      const authError = this.authService.error();
      if (authError) {
        this.error.set(authError);
      }
    });
  }

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group(
      {
        fullName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        phoneNumber: [''],
        agreeToTerms: [false, Validators.requiredTrue],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { passwordsDoNotMatch: true };
    }

    return null;
  }

  onSubmit(): void {
    // Stop here if form is invalid
    if (this.signupForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { fullName, email, password, phoneNumber } = this.signupForm.value;

    this.authService.register({
      fullName,
      email,
      password,
      phoneNumber: phoneNumber || null,
    });

    // Watch for completion
    effect(() => {
      if (!this.authService.isLoading()) {
        this.loading.set(false);
        const authError = this.authService.error();
        if (authError) {
          this.error.set(authError);
        } else {
          // Registration successful, navigate to login
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true' },
          });
        }
      }
    });
  }
}
