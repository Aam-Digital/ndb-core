import { Component, OnInit } from '@angular/core';
import PouchDB from 'pouchdb';
import {AppConfig} from '../../app-config/app-config';
import {AlertService} from '../../alerts/alert.service';
import {Alert} from '../../alerts/alert';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  appConfig = AppConfig.settings;
  alerts: Alert[];

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.alerts = this.alertService.alerts;
  }


  debugDatabase() {
    console.log(new PouchDB(AppConfig.settings.database.name));
  }

}
