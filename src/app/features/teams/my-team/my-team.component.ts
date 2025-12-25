import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService } from '../../../core/services/team.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageService } from '../../../core/services/image.service';
import { Player } from '../../../core/models/player.model';
import { Team } from '../../../core/models/team.model';

interface EventWisePlayer {
  _id: string;
  name: string;
  role: string;
  basePrice: number;
  photo?: string;
  age?: number;
  statistics?: any;
  soldPrice: number;
  purchasedAt: string;
}

interface EventGroup {
  eventId: string;
  eventName: string;
  eventStartDate: string;
  eventStatus: string;
  players: EventWisePlayer[];
  totalSpent: number;
}

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.scss']
})
export class MyTeamComponent implements OnInit {
  team: Team | null = null;
  players: Player[] = [];
  eventWisePlayers: EventGroup[] = [];
  isLoading = false;
  isLoadingEventWise = false;
  currentUser: any;
  viewMode: 'all' | 'by-event' = 'by-event'; // Default to event-wise view

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private router: Router,
    public imageService: ImageService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.loadTeamData();
    this.loadEventWisePlayers();
  }

  loadTeamData(): void {
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
      console.error('No team assigned to user');
      return;
    }

    this.isLoading = true;
    this.teamService.getTeamById(String(teamId)).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.team = response.data;
          // Players are already populated from backend
          this.players = (response.data.players || []) as Player[];
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to load team data:', error);
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

  getLogoUrl(logoPath: string | null | undefined): string {
    return this.imageService.getLogoUrl(logoPath);
  }

  getPhotoUrl(photoPath: string | null | undefined): string {
    return this.imageService.getPhotoUrl(photoPath);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-team-logo.png';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

