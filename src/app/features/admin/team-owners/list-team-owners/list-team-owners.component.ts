import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { User } from '../../../../core/models/user.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-list-team-owners',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './list-team-owners.component.html',
  styleUrls: ['./list-team-owners.component.scss']
})
export class ListTeamOwnersComponent implements OnInit {
  teamOwners: User[] = [];
  isLoading = false;

  constructor(
    private userService: UserService,
    public authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadTeamOwners();
  }

  loadTeamOwners(): void {
    this.isLoading = true;
    this.userService.getTeamOwners().subscribe({
      next: (response) => {
        this.teamOwners = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load team owners');
      }
    });
  }

  editTeamOwner(userId: string): void {
    this.router.navigate([`/admin/team-owners/${userId}/edit`]);
  }

  deleteTeamOwner(user: User): void {
    if (!user._id) return;

    this.confirmationService.confirm({
      header: 'Delete Team Owner',
      message: `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel'
    }).then((accepted) => {
      if (accepted) {
        this.isLoading = true;
        this.userService.deleteUser(user._id!).subscribe({
          next: () => {
            this.notificationService.success('Team owner deleted successfully');
            this.loadTeamOwners();
          },
          error: (error) => {
            this.isLoading = false;
            this.notificationService.error(error.error?.message || 'Failed to delete team owner');
          }
        });
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

