import {RouterModule} from '@angular/router';
import {UserAccountComponent} from './user-account.component';
import {ModuleWithProviders} from '@angular/core';

export const routing: ModuleWithProviders = RouterModule.forChild([
    {path: 'user', component: UserAccountComponent}
]);
