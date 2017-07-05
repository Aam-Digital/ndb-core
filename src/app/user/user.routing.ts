import { Routes,RouterModule } from '@angular/router';
import { UserAccountComponent } from './user-account/user-account.component';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  { path: '', component: UserAccountComponent }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);


