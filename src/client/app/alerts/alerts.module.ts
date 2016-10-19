import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';

import { AlertsComponent } from './alerts.component';
import { AlertService } from './alert.service';
import { AlertModule } from 'ng2-bootstrap/ng2-bootstrap';

@NgModule({
    imports: [CommonModule, AlertModule],
    declarations: [AlertsComponent],
    exports: [AlertsComponent],
    providers: [AlertService]
})
export class AlertsModule {

}

export { AlertsComponent } from './alerts.component';
export { AlertService } from './alert.service';
