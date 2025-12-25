import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuctionEvent } from '../../../core/models/event.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit, OnDestroy {
  
  constructor(
    private eventService: EventService,
    public authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}
  
  events: AuctionEvent[] = [];
  isLoading = false;
  currentUser: any;
  private refreshSubscription?: Subscription;
  private routerSubscription?: Subscription;

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadEvents();
    
    // Refresh events every 10 seconds to update status (without showing loading spinner)
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.refreshEventsSilently();
    });
    
    // Refresh when navigating back to this page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.includes('/events')) {
          this.loadEvents();
        }
      });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.processEvents(response.data || []);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load events');
      }
    });
  }

  private refreshEventsSilently(): void {
    // Refresh without showing loading spinner
    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.processEvents(response.data || []);
      },
      error: (error) => {
        // Silently fail on auto-refresh
        console.error('Failed to refresh events:', error);
      }
    });
  }

  private processEvents(events: AuctionEvent[]): void {
    this.events = events.map(event => {
      // Update event status locally if all players are sold (backend might not have updated yet)
      if (event.status === 'live' && event.stats) {
        const totalPlayers = event.stats.totalPlayers || 0;
        const playersSold = event.stats.playersSold || 0;
        // If all players are sold, mark as completed
        if (totalPlayers > 0 && playersSold >= totalPlayers) {
          console.log(`Event ${event.name} has all players sold (${playersSold}/${totalPlayers}), marking as completed`);
          return { ...event, status: 'completed' as any };
        }
      }
      return event;
    });
  }

  getStatusSeverity(status: string): string {
    const severityMap: { [key: string]: string } = {
      'draft': 'secondary',
      'scheduled': 'info',
      'live': 'danger',
      'completed': 'success',
      'cancelled': 'dark'
    };
    return severityMap[status] || 'secondary';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'auctioneer';
  }

  viewEvent(eventId: string | undefined): void {
    if (!eventId) {
      this.notificationService.error('Invalid event ID. Please refresh the page and try again.');
      console.error('Event ID is missing:', eventId);
      return;
    }
    
    // Find the event to check its status
    const event = this.events.find(e => e._id === eventId);
    
    // Don't allow joining completed events
    if (event && event.status === 'completed') {
      this.notificationService.info('This auction has been completed. All players have been sold.');
      return;
    }
    
    // Ensure eventId is a string (not an object)
    const eventIdString = typeof eventId === 'string' ? eventId : String(eventId);
    
    console.log('Navigating to event:', eventIdString);
    // Navigate to live auction page
    this.router.navigate([`/events/${eventIdString}/live`]);
  }

  startAuction(event: AuctionEvent): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to start the auction "${event.name}"? The auction will begin automatically.`,
      header: 'Start Auction',
      acceptLabel: 'Start',
      rejectLabel: 'Cancel'
    }).then((accepted) => {
      if (accepted) {
        this.eventService.startEvent(event._id!).subscribe({
          next: (response) => {
            this.notificationService.success('Auction has been started successfully!');
            this.loadEvents();
          },
          error: (error) => {
            this.notificationService.error(error.error?.message || 'Failed to start auction');
          }
        });
      }
    });
  }

  canStartAuction(event: AuctionEvent): boolean {
    return this.isAdmin() && 
           (event.status === 'draft' || event.status === 'scheduled') &&
           event.players && event.players.length > 0;
  }
}
