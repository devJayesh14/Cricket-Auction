import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerService } from '../../../core/services/player.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register-player',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register-player.component.html',
  styleUrls: ['./register-player.component.scss']
})
export class RegisterPlayerComponent {
  playerForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  showPassword = false;

  roleOptions = [
    { label: 'Batsman', value: 'batsman' },
    { label: 'Bowler', value: 'bowler' },
    { label: 'All Rounder', value: 'all-rounder' },
    { label: 'Wicket Keeper', value: 'wicket-keeper' },
    { label: 'Wicket Keeper Batsman', value: 'wicket-keeper-batsman' }
  ];


  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    public router: Router,
    private notificationService: NotificationService
  ) {
    this.playerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      age: [null, [Validators.required, Validators.min(16), Validators.max(50)]],
      role: ['', Validators.required],
      basePrice: [100, [Validators.required, Validators.min(100)]],
      photo: [null]
    });
  }

  onFileSelect(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Image size must be less than 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Create preview for UI
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.playerForm.invalid) {
      this.markFormGroupTouched(this.playerForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.playerForm.getRawValue(); // Use getRawValue() to get all form values including disabled fields

    // Build player data from form values
    const playerData = {
      name: formValue.name?.trim(),
      age: Number(formValue.age),
      role: formValue.role,
      basePrice: Number(formValue.basePrice)
    };

    // Pass the selected file to the service
    this.playerService.createPlayer(playerData, this.selectedFile || undefined).subscribe({
      next: (response) => {
        this.notificationService.success(`Player ${response.data.name} registered successfully!`);
        this.playerForm.reset();
        this.selectedFile = null;
        this.previewUrl = null;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || error.error?.errors?.[0]?.message || 'Failed to register player. Please try again.';
        this.notificationService.error(errorMessage);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get name() { return this.playerForm.get('name'); }
  get age() { return this.playerForm.get('age'); }
  get role() { return this.playerForm.get('role'); }
  get basePrice() { return this.playerForm.get('basePrice'); }
}

