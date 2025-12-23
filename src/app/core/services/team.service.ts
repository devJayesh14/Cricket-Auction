import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Team, CreateTeamRequest } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private apiService: ApiService) {}

  createTeam(teamData: CreateTeamRequest, logoFile?: File): Observable<{ success: boolean; data: Team; message: string }> {
    if (logoFile) {
      const formData = new FormData();
      formData.append('name', teamData.name || '');
      formData.append('shortName', teamData.shortName || '');
      formData.append('budget', String(teamData.budget || ''));
      formData.append('logo', logoFile);
      return this.apiService.postFormData<{ success: boolean; data: Team; message: string }>('/teams', formData);
    } else {
      return this.apiService.post<{ success: boolean; data: Team; message: string }>('/teams', teamData);
    }
  }

  getTeams(): Observable<{ success: boolean; data: Team[] }> {
    return this.apiService.get<{ success: boolean; data: Team[] }>('/teams');
  }

  getTeamById(id: string): Observable<{ success: boolean; data: Team }> {
    return this.apiService.get<{ success: boolean; data: Team }>(`/teams/${id}`);
  }

  getTeamPlayersByEvent(teamId: string): Observable<{ 
    success: boolean; 
    data: Array<{
      eventId: string;
      eventName: string;
      eventStartDate: string;
      eventStatus: string;
      players: Array<{
        _id: string;
        name: string;
        role: string;
        basePrice: number;
        photo?: string;
        age?: number;
        statistics?: any;
        soldPrice: number;
        purchasedAt: string;
      }>;
      totalSpent: number;
    }>;
    totalEvents: number;
    totalPlayers: number;
  }> {
    return this.apiService.get(`/teams/${teamId}/players-by-event`);
  }

  getTeamEvents(teamId: string): Observable<{ 
    success: boolean; 
    data: Array<{
      _id: string;
      name: string;
      description?: string;
      startDate: string;
      endDate?: string;
      status: string;
      settings?: any;
      stats?: any;
      teamStats: {
        playersPurchased: number;
        totalSpent: number;
      };
    }>;
    totalEvents: number;
  }> {
    return this.apiService.get(`/teams/${teamId}/events`);
  }

  updateTeam(id: string, teamData: Partial<CreateTeamRequest>, logoFile?: File): Observable<{ success: boolean; data: Team; message: string }> {
    if (logoFile) {
      const formData = new FormData();
      if (teamData.name) formData.append('name', teamData.name);
      if (teamData.shortName) formData.append('shortName', teamData.shortName);
      if (teamData.budget) formData.append('budget', String(teamData.budget));
      formData.append('logo', logoFile);
      return this.apiService.putFormData<{ success: boolean; data: Team; message: string }>(`/teams/${id}`, formData);
    } else {
      return this.apiService.put<{ success: boolean; data: Team; message: string }>(`/teams/${id}`, teamData);
    }
  }

  deleteTeam(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/teams/${id}`);
  }
}

