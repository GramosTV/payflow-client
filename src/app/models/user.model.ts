export interface User {
  id?: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
  enabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
