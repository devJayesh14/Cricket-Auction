import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1100; max-width: 400px;">
      @for (notification of notifications; track notification.id) {
        <div class="alert alert-{{ getAlertClass(notification.type) }} alert-dismissible fade show shadow-sm" role="alert">
          <strong>{{ getTitle(notification.type) }}:</strong> {{ notification.message }}
          @if (notification.dismissible) {
            <button type="button" class="btn-close" (click)="dismiss(notification.id)" aria-label="Close"></button>
          }
        </div>
      }
    </div>
  `
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismiss(id: number): void {
    this.notificationService.removeNotification(id);
  }

  getAlertClass(type: string): string {
    const map: { [key: string]: string } = {
      'success': 'success',
      'error': 'danger',
      'warning': 'warning',
      'info': 'info'
    };
    return map[type] || 'info';
  }

  getTitle(type: string): string {
    const map: { [key: string]: string } = {
      'success': 'Success',
      'error': 'Error',
      'warning': 'Warning',
      'info': 'Info'
    };
    return map[type] || 'Notification';
  }
}

