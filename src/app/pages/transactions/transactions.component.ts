import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
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
import { Transaction } from '../../models/transaction.model';

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
  transactionDetailsTmpl!: TemplateRef<any>;

  displayedColumns: string[] = ['type', 'description', 'timestamp', 'amount', 'status', 'details'];
  dataSource = new MatTableDataSource<Transaction>([]); // Initialized with empty array

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedTransaction: Transaction | null = null;

  loading = true;
  searchTerm = '';
  filterType = '';
  filterStatus = '';
  dateRange = '30'; // Default to last 30 days

  constructor(
    private transactionService: TransactionService,
    private dialog: MatDialog
  ) {}

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
        default:
          // Ensure item is not null and property exists before accessing
          return item && (item as any)[property] !== undefined ? (item as any)[property] : null;
      }
    };
  }

  loadTransactions(): void {
    this.loading = true;
    this.transactionService.getAllTransactions().subscribe({
      next: data => {
        this.transactions = Array.isArray(data) ? data : []; // Ensure data is an array
        this.applyFilter(); // This will update filteredTransactions and dataSource
        this.loading = false;
      },
      error: error => {
        console.error('Error loading transactions', error);
        this.transactions = []; // Initialize to empty array on error
        this.applyFilter(); // Update dataSource to empty array via applyFilter
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    // Ensure this.transactions is an array before filtering.
    if (!Array.isArray(this.transactions)) {
      this.filteredTransactions = [];
    } else {
      let filtered = [...this.transactions];

      if (this.dateRange !== 'all') {
        const daysBack = parseInt(this.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        filtered = filtered.filter(transaction =>
          transaction.timestamp ? new Date(transaction.timestamp) >= cutoffDate : false
        );
      }

      if (this.searchTerm) {
        const lowerSearchTerm = this.searchTerm.toLowerCase();
        filtered = filtered.filter(
          t =>
            t.description?.toLowerCase().includes(lowerSearchTerm) ||
            t.type?.toLowerCase().includes(lowerSearchTerm) ||
            t.status?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      if (this.filterType) {
        filtered = filtered.filter(t => t.type === this.filterType);
      }
      if (this.filterStatus) {
        filtered = filtered.filter(t => t.status === this.filterStatus);
      }

      this.filteredTransactions = filtered;
    }

    this.dataSource.data = this.filteredTransactions;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.dialog.open(this.transactionDetailsTmpl, { width: '400px' });
  }

  downloadTransactionReceipt(transactionId: string): void {
    this.transactionService.downloadTransactionReceipt(Number(transactionId)).subscribe({
      next: data => {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction-${transactionId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Error downloading receipt', error);
      },
    });
  }

  onSearchTermChange(): void {
    this.applyFilter();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.filterStatus = '';
    this.dateRange = '30'; // Reset to default
    this.applyFilter();
  }
}
