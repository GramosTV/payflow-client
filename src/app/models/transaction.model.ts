export enum TransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REQUEST_PAYMENT = 'REQUEST_PAYMENT',
  // Add special types for UI display
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Transaction {
  id?: number;
  transactionNumber: string;
  senderId: number;
  receiverId: number;
  sourceWalletId: number;
  destinationWalletId: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  exchangeRate?: number;
  sourceCurrency: string;
  destinationCurrency: string;
  moneyRequestId?: number;
  qrCodeId?: string;
  createdAt?: Date;

  // Frontend display properties
  senderName?: string;
  receiverName?: string;
  recipientName?: string; // Alternative name for receiver
  timestamp?: string; // For storing ISO date strings from API
  reference?: string; // Reference number or code
}
