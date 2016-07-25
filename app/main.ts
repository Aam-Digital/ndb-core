import { bootstrap }    from '@angular/platform-browser-dynamic';

import { AppComponent } from './app.component';
import { NavigationItemsService } from "./navigation/navigation-items.service";
import { appRouterProviders } from "./app.routes";

bootstrap(AppComponent, [
    appRouterProviders,
    NavigationItemsService
]);
