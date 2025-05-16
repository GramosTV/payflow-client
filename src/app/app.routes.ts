import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { MoneyRequestsComponent } from './pages/money-requests/money-requests.component';
import { QrCodeComponent } from './pages/qr-code/qr-code.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'money-requests', component: MoneyRequestsComponent },
      { path: 'qr-code', component: QrCodeComponent },
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: '**', redirectTo: 'dashboard' },
];
