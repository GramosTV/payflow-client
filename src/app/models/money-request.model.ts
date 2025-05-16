export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  // Add special statuses for UI display
  COMPLETED = 'COMPLETED',
}

export interface MoneyRequest {
  id?: number;
  requestNumber: string;
  requesterId: number;
  requesteeId: number;
  walletId: number;
  amount: number;
  status: RequestStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  timestamp?: string; // For storing ISO date strings from API

  // Frontend display properties
  requesterName?: string;
  requesteeName?: string;
  recipientName?: string; // Alternative name for requestee
  currency?: string;
}
