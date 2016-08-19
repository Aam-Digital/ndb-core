import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatabaseManagerService} from "./database-manager.service";
import {PouchDatabaseManagerService} from "./pouch-database-manager.service";
import {databaseServiceProvider} from "./database-manager.service";
import {ConfigModule} from "../config/config.module";


@NgModule({
    imports: [CommonModule, ConfigModule],
    declarations: [],
    exports: [],
    providers: [
        {provide: DatabaseManagerService, useClass: PouchDatabaseManagerService},
        databaseServiceProvider,
    ]
})
export class DatabaseModule {
}

export {DatabaseManagerService} from "./database-manager.service";
export {Database} from "./database";
