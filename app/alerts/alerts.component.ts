import { Component, OnInit  } from '@angular/core';

import { Alert } from './alert';
import { AlertService } from "./alert.service";
import { AlertComponent } from "ng2-bootstrap/ng2-bootstrap";

@Component({
    selector: 'ndb-alerts',
    //templateUrl: 'app/alerts/alerts.component.html',
    template: '<alert *ngFor="let alert of alerts" [type]="alert.type" dismissible="true" (close)="deleteAlert(alert)">{{ alert.message }}</alert>',
    styleUrls: ['app/alerts/alerts.component.css'],
    directives: [
        AlertComponent
    ]
})
export class AlertsComponent implements OnInit {
    alerts: Alert[] = [];

    constructor(
        private _alertService: AlertService
    ) {}

    ngOnInit() {
        this.alerts = this._alertService.alerts;
    }

    deleteAlert(alert: Alert) {
        this._alertService.removeAlert(alert);
    }
}
