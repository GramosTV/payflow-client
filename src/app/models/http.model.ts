export interface HttpErrorResponse {
  error?: {
    message?: string;
    errors?: ({ message: string } | string)[];
    status?: number;
  };
  status?: number;
  statusText?: string;
  message?: string;
}

export interface ErrorDetails {
  message: string;
  category: 'network' | 'client' | 'server' | 'unknown';
  statusCode?: number;
  technical?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
  status?: number;
}

export interface PaginatedResponse<T = unknown> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
