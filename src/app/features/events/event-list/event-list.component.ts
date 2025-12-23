import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuctionEvent } from '../../../core/models/event.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

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
export class EventListComponent implements OnInit {
  
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

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (response) => {
        this.events = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load events');
      }
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
