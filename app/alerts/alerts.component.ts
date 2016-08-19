import {Component, OnInit} from '@angular/core';

import {Alert} from './alert';
import {AlertService} from "./alert.service";

@Component({
    selector: 'ndb-alerts',
    templateUrl: 'app/alerts/alerts.component.html',
    styleUrls: ['app/alerts/alerts.component.css']

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
