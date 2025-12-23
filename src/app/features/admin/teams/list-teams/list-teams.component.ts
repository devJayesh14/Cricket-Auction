import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService } from '../../../../core/services/team.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { Team } from '../../../../core/models/team.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-list-teams',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './list-teams.component.html',
  styleUrls: ['./list-teams.component.scss']
})
export class ListTeamsComponent implements OnInit {
  teams: Team[] = [];
  isLoading = false;
  baseUrl = environment.apiUrl.replace('/api', '') || 'http://localhost:3000';

  constructor(
    private teamService: TeamService,
    public authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.isLoading = true;
    this.teamService.getTeams().subscribe({
      next: (response) => {
        this.teams = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load teams');
      }
    });
  }

  editTeam(teamId: string): void {
    this.router.navigate([`/admin/teams/${teamId}/edit`]);
  }

  deleteTeam(team: Team): void {
    if (!team._id) return;

    this.confirmationService.confirm({
      header: 'Delete Team',
      message: `Are you sure you want to delete "${team.name}"? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel'
    }).then((accepted) => {
      if (accepted) {
        this.isLoading = true;
        this.teamService.deleteTeam(team._id!).subscribe({
          next: () => {
            this.notificationService.success('Team deleted successfully');
            this.loadTeams();
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.error(error.error?.message || 'Failed to delete team');
          }
        });
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'success',
      'inactive': 'secondary',
      'suspended': 'danger'
    };
    return statusMap[status] || 'secondary';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getLogoUrl(logoPath: string): string {
    if (!logoPath) return '';
    // If logo path already starts with http, return as is
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    // If logo path starts with /uploads, just prepend baseUrl
    if (logoPath.startsWith('/uploads')) {
      return this.baseUrl + logoPath;
    }
    // If logo path starts with uploads (without /), add /
    if (logoPath.startsWith('uploads')) {
      return this.baseUrl + '/' + logoPath;
    }
    // Otherwise, assume it's a relative path and prepend /uploads/teams/
    return this.baseUrl + '/uploads/teams/' + logoPath;
  }

  onImageError(event: any): void {
    // Replace broken image with placeholder
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('image-placeholder')) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'bg-secondary rounded d-flex align-items-center justify-content-center image-placeholder';
      placeholderDiv.style.width = '50px';
      placeholderDiv.style.height = '50px';
      placeholderDiv.innerHTML = '<i class="bi bi-people text-white"></i>';
      event.target.parentElement.appendChild(placeholderDiv);
    }
  }
}

