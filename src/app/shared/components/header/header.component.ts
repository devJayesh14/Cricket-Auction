import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUrl: string = '';
  private routerSubscription?: Subscription;

  constructor(
    public router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.url;
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  goToDashboard(): void {
    // Admin should go to admin dashboard, team owner to regular dashboard
    if (this.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToEvents(): void {
    this.router.navigate(['/events']);
  }

  logout(): void {
    this.authService.logout();
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isTeamOwner(): boolean {
    return this.currentUser?.role === 'team_owner';
  }

  shouldShowNavigationButtons(): boolean {
    return this.isAdmin() || this.isTeamOwner();
  }
}

