import { Component, ElementRef, ViewChild } from '@angular/core';
import { CORE_DIRECTIVES } from '@angular/common';

import { MODAL_DIRECTIVES, BS_VIEW_PROVIDERS, AlertComponent } from 'ng2-bootstrap/ng2-bootstrap';
import { DatabaseManagerService } from "../database/database-manager.service";
import { DatabaseSyncStatus } from "../database/database-sync-status";
import { SessionService } from "../user/session.service";

@Component({
    selector: 'ndb-sync-status',
    directives: [MODAL_DIRECTIVES, CORE_DIRECTIVES, AlertComponent],
    viewProviders: [BS_VIEW_PROVIDERS],
    templateUrl: 'app/sync-status/sync-status.component.html'
})
export class SyncStatusComponent {

    @ViewChild('lgModal') modal:ElementRef;
    syncInProgress:boolean;

    constructor(private _dbManager:DatabaseManagerService,
                private _sessionService:SessionService) {
        this._dbManager.onSyncStatusChanged.subscribe(status => this.handleSyncStatus(status));
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
