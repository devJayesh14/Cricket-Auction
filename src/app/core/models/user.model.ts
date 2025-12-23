export interface User {
  _id?: string;
  email: string;
  name: string;
  role: 'admin' | 'auctioneer' | 'team_owner';
  teamId?: string | null;
  team?: {
    _id?: string;
    name?: string;
    shortName?: string;
    remainingBudget?: number;
    budget?: number;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'auctioneer' | 'team_owner';
  teamId?: string;
}

