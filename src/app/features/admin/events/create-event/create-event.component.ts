import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';
import { PlayerService } from '../../../../core/services/player.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Player } from '../../../../core/models/player.model';
import { AuctionEvent } from '../../../../core/models/event.model';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit {
  eventForm: FormGroup;
  isLoading = false;
  availablePlayers: Player[] = [];
  selectedPlayers: Player[] = [];
  isEditMode = false;
  eventId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private playerService: PlayerService,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    // Format date for datetime-local input
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      startDate: [dateTimeLocal, Validators.required],
      status: ['draft'], // Default status
      // Players field removed - all available players will be automatically added
      settings: this.fb.group({
        bidIncrement: [50, [Validators.required, Validators.min(50)]],
        bidTimer: [10, [Validators.required, Validators.min(10), Validators.max(300)]],
        startingBudget: [10000, [Validators.required, Validators.min(0)]]
      })
    });

    this.loadAvailablePlayers();
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.isEditMode = true;
      this.loadEvent();
    }
  }

  loadEvent(): void {
    if (!this.eventId) return;
    this.isLoading = true;
    this.eventService.getEventById(this.eventId).subscribe({
      next: (response) => {
        const event = response.data;
        // Format date for datetime-local input
        const startDate = new Date(event.startDate);
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');
        const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

        this.eventForm.patchValue({
          name: event.name,
          description: event.description || '',
          startDate: dateTimeLocal,
          status: event.status || 'draft',
          // Players not shown in edit mode - all available players are included automatically
          settings: {
            bidIncrement: event.settings?.bidIncrement || 50,
            bidTimer: event.settings?.bidTimer || 10,
            startingBudget: event.settings?.startingBudget || 10000
          }
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load event details');
      }
    });
  }

  loadAvailablePlayers(): void {
    this.playerService.getPlayers().subscribe({
      next: (response) => {
        // Filter only available players
        this.availablePlayers = response.data.filter(p => p.status === 'available');
      },
      error: (error) => {
        this.notificationService.error('Failed to load players');
      }
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.eventForm.value;

    // Automatically include all available players
    const playerIds = this.availablePlayers
      .filter(p => p._id) // Filter out players without ID
      .map(p => p._id!); // Get all available player IDs

    if (playerIds.length === 0) {
      this.isLoading = false;
      this.notificationService.error('No available players found. Please add players first.');
      return;
    }

    // Convert datetime-local string to ISO string
    let startDateISO: string;
    if (formValue.startDate instanceof Date) {
      startDateISO = formValue.startDate.toISOString();
    } else if (typeof formValue.startDate === 'string') {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      startDateISO = new Date(formValue.startDate).toISOString();
    } else {
      startDateISO = formValue.startDate;
    }

    const eventData: any = {
      name: formValue.name,
      description: formValue.description || '',
      startDate: startDateISO,
      players: playerIds, // All available players automatically included
      settings: formValue.settings
    };

    // Include status only in edit mode (admin can change status)
    if (this.isEditMode && formValue.status) {
      eventData.status = formValue.status;
    }

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, eventData).subscribe({
        next: (response) => {
          this.notificationService.success('Event updated successfully!');
          this.router.navigate(['/admin/events/list']);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Failed to update event. Please try again.';
          this.notificationService.error(errorMessage);
        }
      });
    } else {
      this.eventService.createEvent(eventData).subscribe({
        next: (response) => {
          this.notificationService.success('Event created successfully!');
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Failed to create event. Please try again.';
          this.notificationService.error(errorMessage);
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get name() { return this.eventForm.get('name'); }
  get description() { return this.eventForm.get('description'); }
  get startDate() { return this.eventForm.get('startDate'); }
  get status() { return this.eventForm.get('status'); }
  get settings() { return this.eventForm.get('settings') as FormGroup; }
  get bidIncrement() { return this.settings?.get('bidIncrement'); }
  get bidTimer() { return this.settings?.get('bidTimer'); }
  get startingBudget() { return this.settings?.get('startingBudget'); }
}

