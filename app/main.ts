import { bootstrap }    from '@angular/platform-browser-dynamic';
import {disableDeprecatedForms, provideForms} from '@angular/forms';

import { AppComponent } from './app.component';
import { NavigationItemsService } from "./navigation/navigation-items.service";
import { appRouterProviders } from "./app.routes";

bootstrap(AppComponent, [
    disableDeprecatedForms(),
    provideForms()
    appRouterProviders,
    NavigationItemsService
]);
