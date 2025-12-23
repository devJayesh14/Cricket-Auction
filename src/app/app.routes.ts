import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterPlayerComponent } from './features/players/register-player/register-player.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EventListComponent } from './features/events/event-list/event-list.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { RegisterTeamOwnerComponent } from './features/admin/register-team-owner/register-team-owner.component';

export const routes: Routes = [
  {
    path: 'events/:id/live',
    loadComponent: () => import('./features/auctions/live-auction/live-auction.component').then(m => m.LiveAuctionComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'events',
    component: EventListComponent
  },
  {
    path: 'events/create',
    loadComponent: () => import('./features/admin/events/create-event/create-event.component').then(m => m.CreateEventComponent)
  },
  {
    path: 'players/register',
    component: RegisterPlayerComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
      {
        path: 'my-team',
        loadComponent: () => import('./features/teams/my-team/my-team.component').then(m => m.MyTeamComponent)
      },
      {
        path: 'my-events',
        loadComponent: () => import('./features/teams/my-events/my-events.component').then(m => m.MyEventsComponent)
      },
  {
    path: 'admin',
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'register-team-owner',
        component: RegisterTeamOwnerComponent
      },
      {
        path: 'events/create',
        loadComponent: () => import('./features/admin/events/create-event/create-event.component').then(m => m.CreateEventComponent)
      },
      {
        path: 'events/list',
        loadComponent: () => import('./features/admin/events/list-events/list-events.component').then(m => m.ListEventsComponent)
      },
      {
        path: 'events/:id/edit',
        loadComponent: () => import('./features/admin/events/create-event/create-event.component').then(m => m.CreateEventComponent)
      },
      {
        path: 'players/list',
        loadComponent: () => import('./features/admin/players/list-players/list-players.component').then(m => m.ListPlayersComponent)
      },
      {
        path: 'players/sold',
        loadComponent: () => import('./features/admin/players/sold-players/sold-players.component').then(m => m.SoldPlayersComponent)
      },
      {
        path: 'players/sold/:eventId',
        loadComponent: () => import('./features/admin/players/sold-players/sold-players.component').then(m => m.SoldPlayersComponent)
      },
      {
        path: 'team-owners/list',
        loadComponent: () => import('./features/admin/team-owners/list-team-owners/list-team-owners.component').then(m => m.ListTeamOwnersComponent)
      },
      {
        path: 'team-owners/:id/edit',
        loadComponent: () => import('./features/admin/team-owners/edit-team-owner/edit-team-owner.component').then(m => m.EditTeamOwnerComponent)
      },
      {
        path: 'players/:id/edit',
        loadComponent: () => import('./features/admin/players/edit-player/edit-player.component').then(m => m.EditPlayerComponent)
      },
      {
        path: 'teams/list',
        loadComponent: () => import('./features/admin/teams/list-teams/list-teams.component').then(m => m.ListTeamsComponent)
      },
      {
        path: 'teams/create',
        loadComponent: () => import('./features/admin/teams/create-team/create-team.component').then(m => m.CreateTeamComponent)
      },
      {
        path: 'teams/:id/edit',
        loadComponent: () => import('./features/admin/teams/create-team/create-team.component').then(m => m.CreateTeamComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
