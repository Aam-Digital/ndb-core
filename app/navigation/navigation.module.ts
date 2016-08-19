import {NgModule} from "@angular/core";
import UserModule from "../user/user.module";
import {NavigationComponent} from "./navigation.component";
import {NavigationItemsService} from "./navigation-items.service";
import {routing} from "../app.routes";
import {SessionService} from "../session/session.service";
import {DashboardModule} from "../dashboard/dashboard.module";
import {CommonModule} from "@angular/common";

@NgModule({
    imports: [
        UserModule,
        routing,
        DashboardModule,
        CommonModule
    ],
    declarations: [
        NavigationComponent
    ],
    exports: [
        NavigationComponent
    ],
    providers: [
        NavigationItemsService,
        SessionService
    ]
})
export class NavigationModule {
}

export {NavigationItemsService} from "./navigation-items.service";
export {NavigationComponent} from "./navigation.component";
