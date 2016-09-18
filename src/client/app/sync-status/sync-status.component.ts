import { Component, ViewChild } from '@angular/core';

import { ModalDirective } from 'ng2-bootstrap/ng2-bootstrap';
import { DatabaseManagerService } from '../database/database-manager.service';
import { DatabaseSyncStatus } from '../database/database-sync-status';
import { SessionService } from '../session/session.service';

@Component({
    selector: 'ndb-sync-status',
    templateUrl: 'app/sync-status/sync-status.component.html'
})
export class SyncStatusComponent {

    @ViewChild('lgModal') modal: ModalDirective;
    syncInProgress:boolean;

    constructor(private _dbManager:DatabaseManagerService,
                private _sessionService:SessionService) {
        this._dbManager.onSyncStatusChanged.subscribe( (status: any) => this.handleSyncStatus(status));
    }


    private handleSyncStatus(status:DatabaseSyncStatus) {
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
