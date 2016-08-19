import {Routes, RouterModule}  from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {LoggedInGuard} from "./session/logged-in.guard";
import {ModuleWithProviders} from "@angular/core";


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
