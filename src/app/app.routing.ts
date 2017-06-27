import { Routes, RouterModule } from '@angular/router';
import { LoggedInGuard } from './session/logged-in.guard';
import { ModuleWithProviders } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'user',
    loadChildren: 'app/user/user.module',
    canActivate: [LoggedInGuard]
  },
  {
    path: '**',
    component: DashboardComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
