export interface AuctionEvent {
  _id?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';
  players: string[];
  participatingTeams: string[];
  currentPlayerId?: string;
  currentPlayerStartTime?: string;
  settings: {
    bidIncrement: number;
    bidTimer: number;
    startingBudget: number;
    autoMode?: boolean;
  };
  stats: {
    totalPlayers: number;
    playersSold: number;
    playersUnsold: number;
    totalAmountSpent: number;
  };
  createdBy: string;
  startedBy?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  startDate: string;
  settings?: {
    bidIncrement: number;
    bidTimer: number;
    startingBudget: number;
  };
  players?: string[];
  participatingTeams?: string[];
}

