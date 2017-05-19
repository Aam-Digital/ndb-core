import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModule } from 'ng2-bootstrap';

import { AlertsComponent } from './alerts/alerts.component';
import { AlertService } from './alert.service';

@NgModule({
  imports: [
    CommonModule,
    AlertModule
  ],
  declarations: [AlertsComponent],
  exports: [AlertsComponent],
  providers: [AlertService]
})
export class AlertsModule {
}

export { AlertsComponent };
export { AlertService };
