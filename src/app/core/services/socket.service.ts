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
  private connecting = false;
  private connectionRetries = 0;
  private maxRetries = 3;

  constructor(private authService: AuthService) {}

  /**
   * Connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    if (this.connecting) {
      console.log('Socket connection already in progress...');
      return;
    }

    const token = this.authService.token;
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Check if we've exceeded max retries
    if (this.connectionRetries >= this.maxRetries) {
      console.error('Max connection retries exceeded. Please refresh the page.');
      return;
    }

    this.connecting = true;
    this.connectionRetries++;

    // Extract base URL from API URL (remove /api)
    const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
    const socketUrl = apiUrl.replace('/api', '') || 'http://localhost:3000';
    
    // If socket exists but not connected, disconnect it first
    if (this.socket && !this.socket.connected) {
      // Remove all listeners to prevent memory leaks
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      // Start with polling only (most reliable on Vercel), upgrade to websocket if available
      transports: ['polling'],
      // Allow upgrade to websocket after successful polling connection
      upgrade: true,
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Force new connection to avoid reusing failed connections
      forceNew: true,
      // Additional options for better reliability
      rememberUpgrade: false, // Don't remember websocket upgrade if it fails
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected via', this.socket?.io?.engine?.transport?.name || 'unknown transport');
      this.connected = true;
      this.connecting = false;
      this.connectionRetries = 0; // Reset retry count on successful connection
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      this.connected = false;
      this.connecting = false;
    });

    this.socket.on('connect_error', (error: any) => {
      // Only log error if it's not a transport upgrade error (which is expected)
      const isTransportError = error.message?.includes('websocket') || 
                               error.message?.includes('transport') ||
                               (error as any)?.type === 'TransportError';
      
      if (!isTransportError) {
        console.error('Socket.io connection error:', error);
      } else {
        // Transport errors are expected during fallback, just log at debug level
        console.log('Socket.io transport fallback (this is normal):', error.message);
      }
      
      this.connected = false;
      this.connecting = false;
      
      // Socket.io handles reconnection automatically, so we don't need manual retries
      // Just reset connecting flag to allow automatic reconnection
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

      // Helper to set up listener only when connected
      const setupListener = () => {
        if (this.socket && this.socket.connected) {
          console.log('SocketService: Setting up auction:ended listener');
          this.socket.on('auction:ended', handler);
          return true;
        }
        return false;
      };

      // Try to set up listener immediately if already connected
      if (this.socket && this.socket.connected) {
        setupListener();
      } else {
        // Ensure connection exists
        if (!this.socket) {
          this.connect();
        }

        // Wait for connection with timeout
        let connectionTimeout: any;
        const connectHandler = () => {
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }
          if (setupListener()) {
            if (this.socket) {
              this.socket.off('connect', connectHandler);
            }
          }
        };

        const errorConnectHandler = (error: any) => {
          // Only error if it's not a transport error (expected during fallback)
          const isTransportError = error.message?.includes('websocket') || 
                                   error.message?.includes('transport') ||
                                   (error?.type === 'TransportError');
          
          if (!isTransportError && connectionTimeout) {
            clearTimeout(connectionTimeout);
            console.error('SocketService: Failed to connect after timeout:', error);
            // Don't error the observer immediately - let Socket.io retry
            // observer.error(error);
          }
          
          if (this.socket) {
            this.socket.off('connect_error', errorConnectHandler);
          }
        };

        if (this.socket) {
          if (this.socket.connected) {
            setupListener();
          } else {
            // Set up timeout - if connection takes too long, we'll still set up listener
            // when it eventually connects (Socket.io will retry)
            connectionTimeout = setTimeout(() => {
              console.warn('SocketService: Connection timeout, listener will be set up when connection succeeds');
              if (this.socket) {
                this.socket.off('connect', connectHandler);
                this.socket.off('connect_error', errorConnectHandler);
              }
            }, 30000); // 30 second timeout

            this.socket.once('connect', connectHandler);
            this.socket.once('connect_error', errorConnectHandler);
          }
        } else {
          // Socket creation failed - wait a bit and retry
          setTimeout(() => {
            if (this.socket && this.socket.connected) {
              setupListener();
            }
          }, 1000);
        }
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

  /**
   * Reset connection retry count (useful after manual reconnection)
   */
  resetRetryCount(): void {
    this.connectionRetries = 0;
  }

  /**
   * Force reconnect (useful for recovery)
   */
  reconnect(): void {
    this.disconnect();
    this.resetRetryCount();
    this.connect();
  }
}


