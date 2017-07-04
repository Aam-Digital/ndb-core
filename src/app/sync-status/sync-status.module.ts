import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertModule as BootstrapAlertModule, ModalModule } from 'ngx-bootstrap';

import { SyncStatusComponent } from './sync-status/sync-status.component';
import { DatabaseModule } from '../database/database.module';
import { SessionModule } from '../session/session.module';

@NgModule({
  imports: [
    CommonModule,
    BootstrapAlertModule,
    ModalModule.forRoot(),
    SessionModule,
    DatabaseModule
  ],
  declarations: [SyncStatusComponent],
  exports: [SyncStatusComponent],
  providers: []
})
export class SyncStatusModule { }
