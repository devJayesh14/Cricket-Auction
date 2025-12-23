import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  router = inject(Router);

  constructor(
    private authService: AuthService
  ) {}

  get currentUser() {
    return this.authService.currentUserValue;
  }

  logout(): void {
    this.authService.logout();
  }

  get userRole(): string {
    return this.currentUser?.role || 'user';
  }

  isTeamOwner(): boolean {
    const role = this.currentUser?.role;
    // Debug: log the role to check
    console.log('Dashboard - Current user:', this.currentUser);
    console.log('Dashboard - User role:', role, 'Type:', typeof role);
    const isOwner = role === 'team_owner';
    console.log('Dashboard - isTeamOwner result:', isOwner);
    return isOwner;
  }
}

