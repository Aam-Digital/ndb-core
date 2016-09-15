import {NgModule}           from '@angular/core';
import {CommonModule}       from '@angular/common';

import {NG2BootstrapModule} from "../ng2-bootstrap.module";
import {AlertsModule} from "../alerts/alerts.module";
import {LatestChangesService} from "./latest-changes.service";
import {LatestChangesComponent} from "./latest-changes.component";
import {SessionModule} from "../session/session.module";
import {HttpModule} from "@angular/http";

@NgModule({
    imports: [CommonModule, NG2BootstrapModule, AlertsModule, SessionModule, HttpModule],
    declarations: [LatestChangesComponent],
    exports: [LatestChangesComponent],
    providers: [LatestChangesService]
})
export class LatestChangesModule {


}

