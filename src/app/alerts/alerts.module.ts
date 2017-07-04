import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModule as BootstrapAlertModule } from 'ngx-bootstrap';

import { AlertsComponent } from './alerts/alerts.component';
import { AlertService } from './alert.service';

@NgModule({
  imports: [
    CommonModule,
    BootstrapAlertModule.forRoot()
  ],
  declarations: [AlertsComponent],
  exports: [AlertsComponent],
  providers: [AlertService]
})
export class AlertsModule {
}
