import { bootstrap }    from '@angular/platform-browser-dynamic';
import {disableDeprecatedForms, provideForms} from '@angular/forms';

import { AppComponent } from './app.component';
import { appRouterProviders } from "./app.routes";
import { LoggedInGuard } from "./user/logged-in.guard";
import { NavigationItemsService } from "./navigation/navigation-items.service";
import { SessionService } from "./user/session.service";
import { ConfigService } from "./config/config.service";
import { AlertService } from "./alerts/alert.service";
import { DatabaseManagerService, databaseServiceProvider } from "./database/database-manager.service";
import { PouchDatabaseManagerService } from "./database/pouch-database-manager.service";
import { EntityMapperService } from "./database/entity-mapper.service";

bootstrap(AppComponent, [
    disableDeprecatedForms(),
    provideForms(),
    appRouterProviders,
    SessionService,
    LoggedInGuard,
    NavigationItemsService,
    ConfigService,
    AlertService,
    { provide: DatabaseManagerService, useClass: PouchDatabaseManagerService },
    databaseServiceProvider,
    EntityMapperService
]);
