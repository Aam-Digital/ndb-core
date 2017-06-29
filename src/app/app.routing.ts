import { Routes, RouterModule } from '@angular/router';
import { LoggedInGuard } from './session/logged-in.guard';
import { ModuleWithProviders } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { ChildDetailsComponent} from './children/child-details/child-details.component';

export const routes: Routes = [
  {
    path: 'user',
    loadChildren: 'app/user/user.module',
    canActivate: [LoggedInGuard]
  },
   {
    path: 'child',
    component: ChildDetailsComponent
  },
  {
    path: '**',
    component: DashboardComponent
  },
 
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
