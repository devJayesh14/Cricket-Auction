import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmationOptions {
  message: string;
  header?: string;
  acceptLabel?: string;
  rejectLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<{ options: ConfirmationOptions; resolve: (value: boolean) => void }>();
  public confirmation$ = this.confirmationSubject.asObservable();

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationSubject.next({ options, resolve });
    });
  }
}

