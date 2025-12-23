import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Player, CreatePlayerRequest } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  constructor(private apiService: ApiService) {}

  createPlayer(playerData: CreatePlayerRequest, photoFile?: File): Observable<{ success: boolean; data: Player; message: string }> {
    // If photo file is provided, use FormData, otherwise use JSON
    if (photoFile) {
      const formData = new FormData();
      
      // Add all player fields to FormData
      formData.append('name', playerData.name || '');
      formData.append('age', String(playerData.age || ''));
      formData.append('role', playerData.role || '');
      formData.append('basePrice', String(playerData.basePrice || ''));
      
      // Add statistics as JSON string
      if (playerData.statistics) {
        formData.append('statistics', JSON.stringify(playerData.statistics));
      }
      
      // Add photo file
      formData.append('photo', photoFile);
      
      return this.apiService.postFormData<{ success: boolean; data: Player; message: string }>('/players', formData);
    } else {
      // Fallback to JSON if no file (backward compatibility)
      return this.apiService.post<{ success: boolean; data: Player; message: string }>('/players', playerData);
    }
  }

  getPlayers(status?: string): Observable<{ success: boolean; data: Player[] }> {
    const params = status ? `?status=${status}` : '';
    return this.apiService.get<{ success: boolean; data: Player[] }>(`/players${params}`);
  }

  getPlayerById(id: string): Observable<{ success: boolean; data: Player }> {
    return this.apiService.get<{ success: boolean; data: Player }>(`/players/${id}`);
  }

  updatePlayer(id: string, playerData: Partial<CreatePlayerRequest>, photoFile?: File): Observable<{ success: boolean; data: Player }> {
    if (photoFile) {
      const formData = new FormData();
      
      if (playerData.name) formData.append('name', playerData.name);
      if (playerData.age) formData.append('age', String(playerData.age));
      if (playerData.role) formData.append('role', playerData.role);
      if (playerData.basePrice) formData.append('basePrice', String(playerData.basePrice));
      
      if (playerData.statistics) {
        formData.append('statistics', JSON.stringify(playerData.statistics));
      }
      
      formData.append('photo', photoFile);
      return this.apiService.putFormData<{ success: boolean; data: Player }>(`/players/${id}`, formData);
    } else {
      return this.apiService.put<{ success: boolean; data: Player }>(`/players/${id}`, playerData);
    }
  }

  deletePlayer(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/players/${id}`);
  }
}

