import {Routes, RouterModule}  from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {UserAccountComponent} from "./user/user-account.component";
import {LoggedInGuard} from "./session/logged-in.guard";
import {ModuleWithProviders} from "@angular/core";


export const routes: Routes = [
    {
        path: 'user',
        component: UserAccountComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: '**',
        component: DashboardComponent
    }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
