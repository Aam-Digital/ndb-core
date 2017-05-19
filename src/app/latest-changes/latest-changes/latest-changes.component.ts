import { Component, OnInit, ViewChild } from '@angular/core';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { AlertService } from '../../alerts/alert.service';
import { ConfigService } from '../../config/config.service';
import { LatestChangesService } from '../latest-changes.service';
import { ModalDirective } from 'ng2-bootstrap';
import { Changelog } from '../changelog';

@Component({
  selector: 'app-latest-changes',
  templateUrl: './latest-changes.component.html',
  styleUrls: ['./latest-changes.component.css']
})
export class LatestChangesComponent implements OnInit {

  currentChangelog: Changelog;
  currentVersion: string;

  @ViewChild('latestChangesModal') public latestChangesModal: ModalDirective;

  constructor(private _sessionService: SessionService,
              private _latestChangesService: LatestChangesService,
              private _configService: ConfigService,
              private _alertService: AlertService,
              private _entityMapperService: EntityMapperService) {

    this.currentVersion = this._configService.version;

    _latestChangesService.getChangelog().subscribe(
      changelog => this.currentChangelog = changelog[0],
      error => _alertService.addDanger(error)
    );


    let self = this;
    this._sessionService.onSessionStatusChanged.subscribe(
      function sessionStatus(sessionStatus: SessionStatus) {
        if (sessionStatus === SessionStatus.loggedIn) {
          if (self._sessionService.currentUser.lastUsedVersion !== self.currentVersion) {
            self._sessionService.currentUser.lastUsedVersion = self.currentVersion;
            self._entityMapperService.save(self._sessionService.currentUser);
            self.showLatestChanges();
          }
        }
      }
    );
  }


  ngOnInit(): void {
  }

  public showLatestChanges(): void {
    this.latestChangesModal.show();
  }
}
