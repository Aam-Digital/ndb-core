import { provideRouter, RouterConfig }  from '@angular/router';
import { DashboardComponent } from "./dashboard/dashboard.component";
import { UserAccountComponent } from "./user/user-account.component";
import { LoggedInGuard } from "./user/logged-in.guard";


const routes:RouterConfig = [
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

export const appRouterProviders = [
    provideRouter(routes)
];
