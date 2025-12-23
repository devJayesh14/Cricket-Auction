import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { TeamService } from '../../../../core/services/team.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/user.model';
import { Team } from '../../../../core/models/team.model';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-edit-team-owner',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent
  ],
  templateUrl: './edit-team-owner.component.html',
  styleUrls: ['./edit-team-owner.component.scss']
})
export class EditTeamOwnerComponent implements OnInit {
  editForm: FormGroup;
  isLoading = false;
  userId: string | null = null;
  teams: Team[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private teamService: TeamService,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      teamId: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadTeams();
    if (this.userId) {
      this.loadUser();
    }
  }

  loadTeams(): void {
    this.teamService.getTeams().subscribe({
      next: (response) => {
        this.teams = response.data || [];
      },
      error: (error) => {
        this.notificationService.error('Failed to load teams');
      }
    });
  }

  loadUser(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (response) => {
        const user = response.data;
        this.editForm.patchValue({
          name: user.name,
          email: user.email,
          teamId: user.teamId || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error('Failed to load user details');
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    if (!this.userId) return;

    this.isLoading = true;
    const formValue = this.editForm.value;
    const userData: Partial<User> = {
      name: formValue.name?.trim(),
      email: formValue.email?.trim(),
      teamId: formValue.teamId || null
    };

    this.userService.updateUser(this.userId, userData).subscribe({
      next: () => {
        this.notificationService.success('Team owner updated successfully!');
        this.router.navigate(['/admin/team-owners/list']);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error(error.error?.message || 'Failed to update team owner');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get name() { return this.editForm.get('name'); }
  get email() { return this.editForm.get('email'); }
  get teamId() { return this.editForm.get('teamId'); }
}

