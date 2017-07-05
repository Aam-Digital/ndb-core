import { Routes, RouterModule } from '@angular/router';
import { LoggedInGuard } from './session/logged-in.guard';
import { ModuleWithProviders } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user', loadChildren: 'app/user/user.module#UserModule' }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
