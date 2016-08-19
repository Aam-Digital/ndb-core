import {Routes, RouterModule}  from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {UserAccountComponent} from "./user/user-account.component";
import {LoggedInGuard} from "./user/logged-in.guard";


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

export const routing = RouterModule.forRoot(routes);
