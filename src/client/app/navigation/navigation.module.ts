import { NgModule } from '@angular/core';
import { NavigationComponent } from './navigation.component';
import { NavigationItemsService } from './navigation-items.service';
import { CommonModule } from '@angular/common';
import { SessionModule } from '../session/session.module';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        SessionModule,
        RouterModule,
        CommonModule
    ],
    declarations: [
        NavigationComponent
    ],
    exports: [
        NavigationComponent
    ],
    providers: [
        NavigationItemsService
    ]
})
export class NavigationModule {
}

export { NavigationItemsService } from './navigation-items.service';
export { NavigationComponent } from './navigation.component';
export { MenuItem } from './menu-item';
