import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from './sync-status/sync-status.component';
import { AlertModule, ModalModule } from 'ng2-bootstrap';
import { DatabaseModule } from '../database/database.module';
import { SessionModule } from '../session/session.module';

@NgModule({
  imports: [
    CommonModule,
    AlertModule,
    ModalModule,
    SessionModule,
    DatabaseModule
  ],
  declarations: [SyncStatusComponent],
  exports: [SyncStatusComponent],
  providers: []
})
export class SyncStatusModule { }
