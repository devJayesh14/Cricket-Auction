import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getTeamOwners(): Observable<{ success: boolean; data: User[] }> {
    return this.apiService.get<{ success: boolean; data: User[] }>('/auth/team-owners');
  }

  getUserById(id: string): Observable<{ success: boolean; data: User }> {
    return this.apiService.get<{ success: boolean; data: User }>(`/auth/users/${id}`);
  }

  updateUser(id: string, userData: Partial<User>): Observable<{ success: boolean; data: User; message: string }> {
    return this.apiService.put<{ success: boolean; data: User; message: string }>(`/auth/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/auth/users/${id}`);
  }
}

