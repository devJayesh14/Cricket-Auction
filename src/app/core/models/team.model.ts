import { Player } from './player.model';

export interface Team {
  _id?: string;
  name: string;
  shortName: string;
  logo?: string;
  ownerId?: string | null;
  budget: number;
  spent?: number;
  remainingBudget?: number;
  players?: string[] | Player[];
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamRequest {
  name: string;
  shortName: string;
  budget: number;
  logo?: string;
}

