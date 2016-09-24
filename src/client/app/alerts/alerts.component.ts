import {Component, OnInit} from '@angular/core';

import {Alert} from './alert';
import {AlertService} from './alert.service';

@Component({
    moduleId: module.id,
    selector: 'ndb-alerts',
    templateUrl: './alerts.component.html',
    styleUrls: ['./alerts.component.css']

})
export class AlertsComponent implements OnInit {
    alerts: Alert[] = [];

    constructor(private _alertService: AlertService) {
    }

    ngOnInit() {
        this.alerts = this._alertService.alerts;
    }

    deleteAlert(alert: Alert) {
        this._alertService.removeAlert(alert);
    }
}
