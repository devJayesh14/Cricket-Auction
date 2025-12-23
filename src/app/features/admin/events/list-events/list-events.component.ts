import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { AuctionEvent } from '../../../../core/models/event.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-list-events',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TruncatePipe],
  templateUrl: './list-events.component.html',
  styleUrls: ['./list-events.component.scss']
})
export class ListEventsComponent implements OnInit {
  events: AuctionEvent[] = [];
  isLoading = false;

  constructor(
    private eventService: EventService,
    public authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
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

  editEvent(eventId: string): void {
    this.router.navigate([`/admin/events/${eventId}/edit`]);
  }

  viewSoldPlayers(eventId: string): void {
    this.router.navigate([`/admin/players/sold/${eventId}`]);
  }

  deleteEvent(event: AuctionEvent): void {
    if (!event._id) return;

    this.confirmationService.confirm({
      header: 'Delete Event',
      message: `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel'
    }).then((accepted) => {
      if (accepted) {
        this.isLoading = true;
        this.eventService.deleteEvent(event._id!).subscribe({
          next: () => {
            this.notificationService.success('Event deleted successfully');
            this.loadEvents();
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.error(error.error?.message || 'Failed to delete event');
          }
        });
      }
    });
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

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'secondary',
      'scheduled': 'info',
      'live': 'danger',
      'completed': 'success',
      'cancelled': 'dark',
      'paused': 'warning'
    };
    return statusMap[status] || 'secondary';
  }
}

