import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatabaseManagerService} from "./database-manager.service";
import {PouchDatabaseManagerService} from "./pouch-database-manager.service";
import {databaseServiceProvider} from "./database-manager.service";


@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: [],
    providers: [
        {provide: DatabaseManagerService, useClass: PouchDatabaseManagerService},
        databaseServiceProvider,
    ]
})
export class DatabaseModule {
}
