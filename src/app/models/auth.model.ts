export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}
