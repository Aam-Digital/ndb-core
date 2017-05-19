import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';
import { DatabaseManagerService } from '../../database/database-manager.service';
import { SessionService } from '../../session/session.service';
import { DatabaseSyncStatus } from '../../database/database-sync-status.enum';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit {

  @ViewChild('lgModal') modal: ModalDirective;
  syncInProgress: boolean;

  constructor(private _dbManager: DatabaseManagerService,
              private _sessionService: SessionService) {
    this._dbManager.onSyncStatusChanged.subscribe((status: any) => this.handleSyncStatus(status));
  }

  ngOnInit(): void {
  }

  private handleSyncStatus(status: DatabaseSyncStatus) {
    switch (status) {
      case DatabaseSyncStatus.started:
        this.syncInProgress = true;
        if (!this._sessionService.isLoggedIn()) {
          this.modal.show();
        }
        break;
      case DatabaseSyncStatus.completed:
      case DatabaseSyncStatus.failed:
        this.syncInProgress = false;
        this.modal.hide();
        break;
    }
  }
}
