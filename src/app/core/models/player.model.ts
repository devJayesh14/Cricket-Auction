export interface Player {
  _id?: string;
  name: string;
  age: number;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper' | 'wicket-keeper-batsman';
  basePrice: number;
  currentPrice?: number;
  photo?: string;
  statistics: {
    matches: number;
    runs: number;
    wickets: number;
    average: number;
  };
  status?: 'available' | 'sold' | 'unsold' | 'retired';
  teamId?: string | null | {
    _id?: string;
    name?: string;
    shortName?: string;
    logo?: string;
  };
  soldPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlayerRequest {
  name: string;
  age: number;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper' | 'wicket-keeper-batsman';
  basePrice: number;
  photo?: string;
  statistics?: {
    matches?: number;
    runs?: number;
    wickets?: number;
    average?: number;
  };
}

