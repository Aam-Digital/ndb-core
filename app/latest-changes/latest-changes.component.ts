import {Component, ViewChild, OnInit} from '@angular/core';
import {ModalDirective} from "ng2-bootstrap/ng2-bootstrap";
import {SessionService} from "../session/session.service";
import {LatestChangesService} from "./latest-changes.service";
import {SessionStatus} from "../session/session-status";
import {Changelog} from "./changelog";

@Component({
    selector: 'ndb-latest-changes',
    templateUrl: 'app/latest-changes/latest-changes.component.html'
})
export class LatestChangesComponent implements OnInit {

    errorMessage: string;
    changelog: Changelog[];

    constructor(private _sessionService: SessionService,
                private _latestChangesService: LatestChangesService) {
    }

    ngOnInit(): void {
        this._sessionService.onSessionStatusChanged.subscribe(
            function sessionStatus(sessionStatus: SessionStatus) {
                if (sessionStatus == SessionStatus.loggedIn) {
                    this._latestChangesService.getChangelog().subscribe(
                        changelog => this.changelog = changelog,
                        error => this.errorMessage = <any>error
                    );
                }
            }
        )
    }


    @ViewChild('latestChangesModal') public latestChangesModal: ModalDirective;

    public showLatestChanges(): void {
        this.latestChangesModal.show();
    }

}
