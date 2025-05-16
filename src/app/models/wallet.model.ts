export interface Wallet {
  id?: number;
  userId?: number;
  currency: string;
  balance: number;
  walletNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}
