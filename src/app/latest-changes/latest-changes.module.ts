import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LatestChangesComponent } from './latest-changes/latest-changes.component';
import { AlertsModule } from '../alerts/alerts.module';
import { HttpModule } from '@angular/http';
import { ModalModule } from 'ng2-bootstrap';
import { LatestChangesService } from './latest-changes.service';

@NgModule({
  imports: [
    CommonModule,
    AlertsModule,
    ModalModule,
    SessionModule,
    HttpModule
  ],
  declarations: [LatestChangesComponent],
  exports: [LatestChangesComponent],
  providers: [LatestChangesService]
})
export class LatestChangesModule {
}
