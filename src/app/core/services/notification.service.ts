import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();
  private idCounter = 0;

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const notifications = this.notificationsSubject.value;
    const newNotification: Notification = {
      ...notification,
      id: this.idCounter++,
      dismissible: notification.dismissible !== false
    };
    this.notificationsSubject.next([...notifications, newNotification]);

    // Auto-dismiss after 5 seconds for success/info, 7 seconds for error/warning
    const duration = notification.type === 'success' || notification.type === 'info' ? 5000 : 7000;
    setTimeout(() => {
      this.removeNotification(newNotification.id);
    }, duration);
  }

  success(message: string): void {
    this.addNotification({ message, type: 'success' });
  }

  error(message: string): void {
    this.addNotification({ message, type: 'error' });
  }

  warning(message: string): void {
    this.addNotification({ message, type: 'warning' });
  }

  info(message: string): void {
    this.addNotification({ message, type: 'info' });
  }

  removeNotification(id: number): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(notifications);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }
}

