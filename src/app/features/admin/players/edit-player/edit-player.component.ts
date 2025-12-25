import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../../../core/services/player.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ImageService } from '../../../../core/services/image.service';
import { Player } from '../../../../core/models/player.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-edit-player',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent
  ],
  templateUrl: './edit-player.component.html',
  styleUrls: ['./edit-player.component.scss']
})
export class EditPlayerComponent implements OnInit {
  playerForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  playerId: string | null = null;
  existingPhotoUrl: string | null = null;

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
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private imageService: ImageService
  ) {
    this.playerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      age: [null, [Validators.required, Validators.min(16), Validators.max(50)]],
      role: ['', Validators.required],
      basePrice: [null, [Validators.required, Validators.min(0)]],
      photo: [null]
    });
  }

  ngOnInit(): void {
    this.playerId = this.route.snapshot.paramMap.get('id');
    if (this.playerId) {
      this.loadPlayer();
    }
  }

  loadPlayer(): void {
    if (!this.playerId) return;
    this.isLoading = true;
    this.playerService.getPlayerById(this.playerId).subscribe({
      next: (response) => {
        const player = response.data;
        this.playerForm.patchValue({
          name: player.name,
          age: player.age,
          role: player.role,
          basePrice: player.basePrice
        });
        if (player.photo) {
          this.existingPhotoUrl = this.imageService.getPhotoUrl(player.photo);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load player details');
      }
    });
  }

  onFileSelect(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Image size must be less than 5MB');
        return;
      }
      this.selectedFile = file;
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

    if (!this.playerId) return;

    this.isLoading = true;
    const formValue = this.playerForm.getRawValue();

    const playerData = {
      name: formValue.name?.trim(),
      age: Number(formValue.age),
      role: formValue.role,
      basePrice: Number(formValue.basePrice)
    };

    this.playerService.updatePlayer(this.playerId, playerData, this.selectedFile || undefined).subscribe({
      next: () => {
        this.notificationService.success('Player updated successfully!');
        this.router.navigate(['/admin/players/list']);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error(error.error?.message || 'Failed to update player');
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

