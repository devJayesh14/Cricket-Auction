import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" [class.show]="isVisible" [style.display]="isVisible ? 'block' : 'none'" tabindex="-1" role="dialog" [attr.aria-hidden]="!isVisible">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ options?.header || 'Confirm' }}</h5>
            <button type="button" class="btn-close" (click)="reject()" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>{{ options?.message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="reject()">
              {{ options?.rejectLabel || 'Cancel' }}
            </button>
            <button type="button" class="btn btn-primary" (click)="accept()">
              {{ options?.acceptLabel || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    @if (isVisible) {
      <div class="modal-backdrop fade show" (click)="reject()"></div>
    }
  `,
  styles: [`
    .modal.show {
      display: block;
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  options?: any;
  private subscription?: Subscription;
  private currentResolve?: (value: boolean) => void;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.confirmation$.subscribe(
      ({ options, resolve }) => {
        this.options = options;
        this.currentResolve = resolve;
        this.isVisible = true;
        document.body.classList.add('modal-open');
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  accept(): void {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
    this.currentResolve?.(true);
    this.currentResolve = undefined;
  }

  reject(): void {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
    this.currentResolve?.(false);
    this.currentResolve = undefined;
  }
}

