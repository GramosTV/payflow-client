import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, TransactionType, TransactionStatus } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('transactionDetailsTmpl')
  transactionDetailsTmpl!: TemplateRef<Transaction>;
  private transactionService = inject(TransactionService);
  private dialog = inject(MatDialog); // Expose enums for template use
  public readonly TransactionType = TransactionType;
  public readonly TransactionStatus = TransactionStatus;

  displayedColumns: string[] = ['type', 'description', 'timestamp', 'amount', 'status', 'details'];
  dataSource = new MatTableDataSource<Transaction>([]);

  // Signals for state management
  selectedTransaction = signal<Transaction | null>(null);
  searchTerm = signal<string>('');
  filterType = signal<string>('');
  filterStatus = signal<string>('');
  dateRange = signal<string>('30'); // Default to last 30 days

  // Computed values from service signals
  transactions = computed(() => this.transactionService.transactions());
  loading = computed(() => this.transactionService.isLoading());

  // Computed filtered transactions
  filteredTransactions = computed(() => {
    let transactions = this.transactions();
    const search = this.searchTerm().toLowerCase();
    const type = this.filterType();
    const status = this.filterStatus();
    const range = this.dateRange();

    // Filter by search term
    if (search) {
      transactions = transactions.filter(
        t =>
          t.description?.toLowerCase().includes(search) ||
          t.type?.toLowerCase().includes(search) ||
          t.amount?.toString().includes(search)
      );
    }

    // Filter by type
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by status
    if (status) {
      transactions = transactions.filter(t => t.status === status);
    }

    // Filter by date range
    if (range && range !== 'all') {
      const days = parseInt(range);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      transactions = transactions.filter(t => {
        if (!t.timestamp) return false;
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= cutoffDate;
      });
    }

    return transactions;
  });

  constructor() {
    // Effect to update data source when filtered transactions change
    effect(() => {
      const filtered = this.filteredTransactions();
      this.dataSource.data = filtered;
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'timestamp':
          return item.timestamp ? new Date(item.timestamp).getTime() : 0;
        case 'amount':
          return item.amount || 0;
        case 'type':
          return item.type || '';
        case 'description':
          return item.description || '';
        case 'status':
          return item.status || '';
        default:
          return '';
      }
    };
  }

  loadTransactions(): void {
    this.transactionService.loadTransactions();
  }

  applyFilter(): void {
    // The computed property automatically handles filtering
    // This method exists for template compatibility
  }

  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction.set(transaction);
    this.dialog.open(this.transactionDetailsTmpl, {
      width: '500px',
    });
  }

  exportTransactions(): void {
    const transactions = this.filteredTransactions();
    if (transactions.length === 0) {
      return;
    }

    // Convert to CSV
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t =>
        [
          t.timestamp ? new Date(t.timestamp).toLocaleDateString() : '',
          t.type || '',
          `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
          t.amount || '',
          t.status || '',
        ].join(',')
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  refreshTransactions(): void {
    this.loadTransactions();
  }
  getStatusClass(status: string): string {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case TransactionStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case TransactionStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case TransactionStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
  getTypeIcon(type: string): string {
    switch (type) {
      case TransactionType.PAYMENT:
        return 'payment';
      case TransactionType.TRANSFER:
        return 'swap_horiz';
      case TransactionType.DEPOSIT:
        return 'add_circle';
      case TransactionType.WITHDRAWAL:
        return 'remove_circle';
      case TransactionType.REQUEST_PAYMENT:
        return 'request_quote';
      case TransactionType.RECEIVED:
        return 'arrow_downward';
      case TransactionType.SENT:
        return 'arrow_upward';
      default:
        return 'account_balance_wallet';
    }
  }
}
