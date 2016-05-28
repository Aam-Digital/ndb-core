import { bootstrap }    from '@angular/platform-browser-dynamic';
import { ROUTER_PROVIDERS } from "@angular/router-deprecated";

import { AppComponent } from './app.component';
import { NavigationItemsService } from "./navigation/navigation-items.service";

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    NavigationItemsService
]);
