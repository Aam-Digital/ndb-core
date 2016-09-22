import {NgModule}           from '@angular/core';
import {CommonModule}       from '@angular/common';

import {AlertsModule} from '../alerts/alerts.module';
import {LatestChangesService} from './latest-changes.service';
import {LatestChangesComponent} from './latest-changes.component';
import {SessionModule} from '../session/session.module';
import {HttpModule} from '@angular/http';
import {ModalModule} from 'ng2-bootstrap/ng2-bootstrap';

@NgModule({
    imports: [CommonModule, AlertsModule, ModalModule, SessionModule, HttpModule],
    declarations: [LatestChangesComponent],
    exports: [LatestChangesComponent],
    providers: [LatestChangesService]
})
export class LatestChangesModule {


}

