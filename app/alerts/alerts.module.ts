import {NgModule}           from '@angular/core';
import {CommonModule}       from '@angular/common';

import {AlertsComponent} from "./alerts.component";
import {AlertService} from "./alert.service";
import {NG2BootstrapModule} from "../ng2-bootstrap.module";

@NgModule({
    imports: [CommonModule, NG2BootstrapModule],
    declarations: [AlertsComponent],
    exports: [AlertsComponent],
    providers: [AlertService]
})
export class AlertsModule {

}

export {AlertsComponent} from "./alerts.component";
export {AlertService} from "./alert.service";
