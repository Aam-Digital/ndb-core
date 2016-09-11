import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {SyncStatusComponent} from "./sync-status.component";
import { SessionModule } from "../session/session.module";
import { DatabaseModule } from "../database/database.module";
import { AlertModule, ModalModule } from "ng2-bootstrap/ng2-bootstrap";


@NgModule({
    imports: [CommonModule, AlertModule, ModalModule, SessionModule, DatabaseModule],
    declarations: [SyncStatusComponent],
    exports: [SyncStatusComponent],
    providers: []
})
export class SyncStatusModule {

}
