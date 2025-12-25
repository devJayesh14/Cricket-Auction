import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ImageService } from '../../../../core/services/image.service';

interface SoldPlayer {
  _id: string;
  name: string;
  role: string;
  basePrice: number;
  photo?: string;
  age?: number;
  statistics?: any;
  soldPrice: number;
  teamId: {
    _id: string;
    name: string;
    shortName?: string;
    logo?: string;
  };
  soldAt: string;
  bidder: {
    _id: string;
    name: string;
    email: string;
  };
}

interface TeamGroup {
  teamId: string;
  teamName: string;
  teamShortName?: string;
  teamLogo?: string;
  players: SoldPlayer[];
  totalSpent: number;
}

@Component({
  selector: 'app-sold-players',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './sold-players.component.html',
  styleUrls: ['./sold-players.component.scss']
})
export class SoldPlayersComponent implements OnInit {
  soldPlayers: SoldPlayer[] = [];
  teamGroups: TeamGroup[] = [];
  isLoading = false;
  eventId: string | null = null;
  eventName: string = '';

  constructor(
    private eventService: EventService,
    public authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Get eventId from route params if available
    this.eventId = this.route.snapshot.paramMap.get('eventId');
    
    if (this.eventId) {
      this.loadSoldPlayers();
    } else {
      // If no eventId, show message or redirect
      this.notificationService.warning('Please select an event to view sold players');
      this.router.navigate(['/admin/events/list']);
    }
  }

  loadSoldPlayers(): void {
    if (!this.eventId) {
      this.notificationService.error('Event ID is required');
      return;
    }

    this.isLoading = true;
    // Fetch sold players for specific event
    this.eventService.getSoldPlayers(this.eventId).subscribe({
      next: (response) => {
        this.soldPlayers = response.data || [];
        this.groupByTeam();
        this.isLoading = false;
        
        // Load event name for display
        this.eventService.getEventById(this.eventId!).subscribe({
          next: (eventResponse) => {
            this.eventName = eventResponse.data.name;
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load sold players');
      }
    });
  }

  groupByTeam(): void {
    const teamMap = new Map<string, TeamGroup>();

    this.soldPlayers.forEach(player => {
      // teamId is already populated object from API
      const team = player.teamId;
      const teamId = team._id;

      if (!teamId) return;

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          teamId: teamId,
          teamName: team.name || 'Unknown Team',
          teamShortName: team.shortName || '',
          teamLogo: team.logo || '',
          players: [],
          totalSpent: 0
        });
      }

      const group = teamMap.get(teamId)!;
      group.players.push(player);
      group.totalSpent += player.soldPrice || 0;
    });

    // Convert map to array and sort by team name
    this.teamGroups = Array.from(teamMap.values()).sort((a, b) => 
      a.teamName.localeCompare(b.teamName)
    );
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getRoleBadgeClass(role: string): string {
    const roleMap: { [key: string]: string } = {
      'batsman': 'primary',
      'bowler': 'danger',
      'all-rounder': 'success',
      'wicket-keeper': 'warning',
      'wicket-keeper-batsman': 'info'
    };
    return roleMap[role] || 'secondary';
  }
}

