import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuctionEvent, CreateEventRequest } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private apiService: ApiService) {}

  getEvents(): Observable<{ success: boolean; data: AuctionEvent[] }> {
    return this.apiService.get<{ success: boolean; data: AuctionEvent[] }>('/events');
  }

  getEventById(id: string): Observable<{ success: boolean; data: AuctionEvent }> {
    return this.apiService.get<{ success: boolean; data: AuctionEvent }>(`/events/${id}`);
  }

  createEvent(eventData: CreateEventRequest): Observable<{ success: boolean; data: AuctionEvent; message: string }> {
    return this.apiService.post<{ success: boolean; data: AuctionEvent; message: string }>('/events', eventData);
  }

  updateEvent(id: string, eventData: Partial<CreateEventRequest>): Observable<{ success: boolean; data: AuctionEvent }> {
    return this.apiService.put<{ success: boolean; data: AuctionEvent }>(`/events/${id}`, eventData);
  }

  startEvent(id: string): Observable<{ success: boolean; data: AuctionEvent; message: string }> {
    return this.apiService.post<{ success: boolean; data: AuctionEvent; message: string }>(`/events/${id}/start`, {});
  }

  deleteEvent(id: string): Observable<{ success: boolean; message: string }> {
    return this.apiService.delete<{ success: boolean; message: string }>(`/events/${id}`);
  }

  startPlayerAuction(eventId: string, playerId: string): Observable<{ success: boolean; message: string; data: AuctionEvent }> {
    return this.apiService.post<{ success: boolean; message: string; data: AuctionEvent }>(`/events/${eventId}/start-player`, { playerId });
  }

  getSoldPlayers(eventId: string): Observable<{ success: boolean; data: any[]; count: number }> {
    return this.apiService.get<{ success: boolean; data: any[]; count: number }>(`/events/${eventId}/sold-players`);
  }
}

