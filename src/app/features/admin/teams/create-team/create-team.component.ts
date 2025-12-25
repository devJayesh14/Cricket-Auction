import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TeamService } from '../../../../core/services/team.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ImageService } from '../../../../core/services/image.service';
import { Team, CreateTeamRequest } from '../../../../core/models/team.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-create-team',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent
  ],
  templateUrl: './create-team.component.html',
  styleUrls: ['./create-team.component.scss']
})
export class CreateTeamComponent implements OnInit {
  teamForm: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isEditMode = false;
  teamId: string | null = null;
  existingLogoUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private imageService: ImageService
  ) {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortName: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Z0-9]+$/)]],
      budget: [10000, [Validators.required, Validators.min(0)]],
      logo: [null]
    });
  }

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('id');
    if (this.teamId) {
      this.isEditMode = true;
      this.loadTeam();
    }
  }

  loadTeam(): void {
    if (!this.teamId) return;
    this.isLoading = true;
    this.teamService.getTeamById(this.teamId).subscribe({
      next: (response) => {
        const team = response.data;
        this.teamForm.patchValue({
          name: team.name,
          shortName: team.shortName,
          budget: team.budget
        });
        if (team.logo) {
          this.existingLogoUrl = this.imageService.getLogoUrl(team.logo);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load team details');
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
      // Clear existing logo URL when new file is selected to show preview
      this.existingLogoUrl = null;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.markFormGroupTouched(this.teamForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.teamForm.value;
    const teamData: CreateTeamRequest = {
      name: formValue.name,
      shortName: formValue.shortName.toUpperCase(),
      budget: formValue.budget
    };

    if (this.isEditMode && this.teamId) {
      this.teamService.updateTeam(this.teamId, teamData, this.selectedFile || undefined).subscribe({
        next: () => {
          this.notificationService.success('Team updated successfully!');
          this.router.navigate(['/admin/teams/list']);
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error(error.error?.message || 'Failed to update team');
        }
      });
    } else {
      this.teamService.createTeam(teamData, this.selectedFile || undefined).subscribe({
        next: () => {
          this.notificationService.success('Team created successfully!');
          this.teamForm.reset();
          this.selectedFile = null;
          this.previewUrl = null;
          this.isLoading = false;
          this.router.navigate(['/admin/teams/list']);
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error(error.error?.message || 'Failed to create team');
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get name() { return this.teamForm.get('name'); }
  get shortName() { return this.teamForm.get('shortName'); }
  get budget() { return this.teamForm.get('budget'); }
}

