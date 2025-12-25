import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  constructor(private authService: AuthService) {}

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.token;
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Extract base URL from API URL (remove /api)
    const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
    const socketUrl = apiUrl.replace('/api', '') || 'http://localhost:3000';
    
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.connected = false;
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join an auction room
   */
  joinAuction(eventId: string): void {
    if (!this.socket || !this.connected) {
      this.connect();
      // Wait for connection before joining
      this.socket?.once('connect', () => {
        this.socket?.emit('join:auction', { eventId });
      });
    } else {
      this.socket.emit('join:auction', { eventId });
    }
  }

  /**
   * Leave an auction room
   */
  leaveAuction(eventId: string): void {
    if (this.socket && this.connected) {
      this.socket.emit('leave:auction', { eventId });
    }
  }

  /**
   * Listen for bid received events
   */
  onBidReceived(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('bid:received', handler);

      return () => {
        this.socket?.off('bid:received', handler);
      };
    });
  }

  /**
   * Listen for current player updates
   */
  onPlayerUpdate(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('player:current', handler);

      return () => {
        this.socket?.off('player:current', handler);
      };
    });
  }

  /**
   * Listen for auction status updates
   */
  onAuctionStatus(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('auction:status', handler);

      return () => {
        this.socket?.off('auction:status', handler);
      };
    });
  }

  /**
   * Listen for player sold events
   */
  onPlayerSold(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('player:sold', handler);

      return () => {
        this.socket?.off('player:sold', handler);
      };
    });
  }

  /**
   * Listen for player unsold events
   */
  onPlayerUnsold(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('player:unsold', handler);

      return () => {
        this.socket?.off('player:unsold', handler);
      };
    });
  }

  /**
   * Listen for auction joined confirmation
   */
  onAuctionJoined(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('auction:joined', handler);

      return () => {
        this.socket?.off('auction:joined', handler);
      };
    });
  }

  /**
   * Submit bid via socket
   */
  submitBid(eventId: string, playerId: string, amount: number): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
        observer.complete();
      };

      this.socket?.once('bid:response', handler);
      this.socket?.emit('bid:submit', { eventId, playerId, amount });
    });
  }

  /**
   * Start player auction via socket (admin only)
   */
  startPlayerAuction(eventId: string, playerId: string): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
        observer.complete();
      };

      this.socket?.once('player:start:response', handler);
      this.socket?.emit('player:start', { eventId, playerId });
    });
  }

  /**
   * Listen for team balance updates
   */
  onTeamBalanceUpdate(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('team:balance', handler);

      return () => {
        this.socket?.off('team:balance', handler);
      };
    });
  }

  /**
   * Listen for available players updates
   */
  onAvailablePlayersUpdate(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('players:available', handler);

      return () => {
        this.socket?.off('players:available', handler);
      };
    });
  }

  /**
   * Listen for event updates
   */
  onEventUpdate(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket?.on('event:update', handler);

      return () => {
        this.socket?.off('event:update', handler);
      };
    });
  }

  /**
   * Listen for auction ended events
   */
  onAuctionEnded(): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => {
        console.log('SocketService: auction:ended event received', data);
        observer.next(data);
      };

      // Ensure socket is connected
      if (!this.socket || !this.connected) {
        this.connect();
        // Wait for connection before setting up listener
        const connectHandler = () => {
          console.log('SocketService: Socket connected, setting up auction:ended listener');
          if (this.socket) {
            this.socket.on('auction:ended', handler);
            this.socket.off('connect', connectHandler);
          }
        };
        if (this.socket) {
          if (this.socket.connected) {
            // Already connected, set up listener immediately
            console.log('SocketService: Socket already connected, setting up auction:ended listener');
            this.socket.on('auction:ended', handler);
          } else {
            // Wait for connection
            this.socket.once('connect', connectHandler);
          }
        }
      } else {
        // Socket is already connected, set up listener immediately
        console.log('SocketService: Setting up auction:ended listener (socket already connected)');
        this.socket.on('auction:ended', handler);
      }

      return () => {
        console.log('SocketService: Cleaning up auction:ended listener');
        this.socket?.off('auction:ended', handler);
      };
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

