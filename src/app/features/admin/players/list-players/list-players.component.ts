import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayerService } from '../../../../core/services/player.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { Player } from '../../../../core/models/player.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-list-players',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './list-players.component.html',
  styleUrls: ['./list-players.component.scss']
})
export class ListPlayersComponent implements OnInit {
  players: Player[] = [];
  isLoading = false;

  constructor(
    private playerService: PlayerService,
    public authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.isLoading = true;
    this.playerService.getPlayers().subscribe({
      next: (response) => {
        this.players = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load players');
      }
    });
  }

  editPlayer(playerId: string): void {
    this.router.navigate([`/admin/players/${playerId}/edit`]);
  }

  deletePlayer(player: Player): void {
    if (!player._id) return;

    this.confirmationService.confirm({
      header: 'Delete Player',
      message: `Are you sure you want to delete "${player.name}"? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel'
    }).then((accepted) => {
      if (accepted) {
        this.isLoading = true;
        this.playerService.deletePlayer(player._id!).subscribe({
          next: () => {
            this.notificationService.success('Player deleted successfully');
            this.loadPlayers();
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.error(error.error?.message || 'Failed to delete player');
          }
        });
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'success',
      'sold': 'primary',
      'unsold': 'secondary'
    };
    return statusMap[status] || 'secondary';
  }
}

