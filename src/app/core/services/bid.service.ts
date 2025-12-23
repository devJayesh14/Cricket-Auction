import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PlaceBidRequest {
  eventId: string;
  playerId: string;
  amount: number;
}

export interface Bid {
  _id?: string;
  auctionEventId: string;
  playerId: string;
  teamId: string;
  bidderId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'outbid' | 'winning' | 'rejected';
  isWinningBid: boolean;
  bidTime: string;
}

export interface CurrentBidResponse {
  currentPlayer: any;
  currentBid: Bid | null;
  currentBidAmount: number;
  nextBidAmount: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class BidService {
  constructor(private apiService: ApiService) {}

  placeBid(bidData: PlaceBidRequest): Observable<{ success: boolean; message: string; data: Bid }> {
    return this.apiService.post<{ success: boolean; message: string; data: Bid }>('/bids', bidData);
  }

  getCurrentBid(eventId: string): Observable<{ success: boolean; data: CurrentBidResponse }> {
    return this.apiService.get<{ success: boolean; data: CurrentBidResponse }>(`/bids/event/${eventId}/current`);
  }

  getPlayerBids(eventId: string, playerId: string): Observable<{ success: boolean; data: Bid[] }> {
    return this.apiService.get<{ success: boolean; data: Bid[] }>(`/bids/event/${eventId}/player/${playerId}`);
  }
}

