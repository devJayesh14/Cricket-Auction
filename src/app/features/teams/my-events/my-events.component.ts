import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService } from '../../../core/services/team.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ImageService } from '../../../core/services/image.service';

interface TeamEvent {
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
}

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './my-events.component.html',
  styleUrls: ['./my-events.component.scss']
})
export class MyEventsComponent implements OnInit {
  events: TeamEvent[] = [];
  eventWisePlayers: any[] = [];
  isLoading = false;
  isLoadingEventWise = false;
  currentUser: any;
  expandedEvents: Set<string> = new Set();

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    public imageService: ImageService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.loadMyEvents();
    this.loadEventWisePlayers();
  }

  loadMyEvents(): void {
    // Extract teamId properly - handle both string and object cases
    let teamId: string | null = null;
    
    if (this.currentUser?.teamId) {
      teamId = typeof this.currentUser.teamId === 'string' 
        ? this.currentUser.teamId 
        : (this.currentUser.teamId as any)?._id || null;
    }
    
    if (!teamId && this.currentUser?.team?._id) {
      teamId = typeof this.currentUser.team._id === 'string'
        ? this.currentUser.team._id
        : null;
    }

    if (!teamId) {
      this.notificationService.warning('No team assigned to your account.');
      return;
    }

    this.isLoading = true;
    this.teamService.getTeamEvents(String(teamId)).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          // Update event status locally if all players are sold
          this.events = response.data.map((event: TeamEvent) => {
            if (event.status === 'live' && event.stats) {
              const totalPlayers = event.stats.totalPlayers || 0;
              const playersSold = event.stats.playersSold || 0;
              // If all players are sold, mark as completed
              if (totalPlayers > 0 && playersSold >= totalPlayers) {
                return { ...event, status: 'completed' };
              }
            }
            return event;
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load your events');
        console.error('Failed to load events:', error);
      }
    });
  }

  loadEventWisePlayers(): void {
    // Extract teamId properly - handle both string and object cases
    let teamId: string | null = null;
    
    if (this.currentUser?.teamId) {
      teamId = typeof this.currentUser.teamId === 'string' 
        ? this.currentUser.teamId 
        : (this.currentUser.teamId as any)?._id || null;
    }
    
    if (!teamId && this.currentUser?.team?._id) {
      teamId = typeof this.currentUser.team._id === 'string'
        ? this.currentUser.team._id
        : null;
    }

    if (!teamId) {
      return;
    }

    this.isLoadingEventWise = true;
    this.teamService.getTeamPlayersByEvent(String(teamId)).subscribe({
      next: (response) => {
        this.isLoadingEventWise = false;
        if (response.success && response.data) {
          this.eventWisePlayers = response.data;
        }
      },
      error: (error) => {
        this.isLoadingEventWise = false;
        console.error('Failed to load event-wise players:', error);
      }
    });
  }

  toggleEvent(eventId: string): void {
    if (this.expandedEvents.has(eventId)) {
      this.expandedEvents.delete(eventId);
    } else {
      this.expandedEvents.add(eventId);
    }
  }

  isEventExpanded(eventId: string): boolean {
    return this.expandedEvents.has(eventId);
  }

  getPlayersForEvent(eventId: string): any[] {
    const eventGroup = this.eventWisePlayers.find(e => e.eventId === eventId);
    return eventGroup ? eventGroup.players : [];
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

  viewEvent(eventId: string): void {
    // Find the event to check its status
    const event = this.events.find(e => e._id === eventId);
    
    // Don't allow joining completed events
    if (event && event.status === 'completed') {
      this.notificationService.info('This auction has been completed. All players have been sold.');
      return;
    }
    
    this.router.navigate([`/events/${eventId}/live`]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getLogoUrl(logoPath: string | null | undefined): string {
    return this.imageService.getLogoUrl(logoPath);
  }

  getPhotoUrl(photoPath: string | null | undefined): string {
    return this.imageService.getPhotoUrl(photoPath);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-team-logo.png';
  }
}

