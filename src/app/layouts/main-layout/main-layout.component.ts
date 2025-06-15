import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatSidenavModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;

  pageTitle = 'Dashboard';
  user: User | null = null;
  userInitials = '';
  notifications = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    // Update page title based on route
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      this.setPageTitle(url);
    });

    // Mock notifications
    this.notifications = Math.floor(Math.random() * 5);
  }

  loadUserData(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user && this.user.fullName) {
      const nameParts = this.user.fullName.split(' ');
      this.userInitials = nameParts
        .map(part => part[0])
        .join('')
        .toUpperCase();
    } else {
      this.userInitials = 'U';
    }
  }

  setPageTitle(url: string): void {
    if (url.includes('/dashboard')) {
      this.pageTitle = 'Dashboard';
    } else if (url.includes('/wallet')) {
      this.pageTitle = 'Wallet';
    } else if (url.includes('/transactions')) {
      this.pageTitle = 'Transactions';
    } else if (url.includes('/money-requests')) {
      this.pageTitle = 'Money Requests';
    } else if (url.includes('/qr-code')) {
      this.pageTitle = 'QR Code';
    }
  }

  toggleSidebar(): void {
    this.drawer.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
