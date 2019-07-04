import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminComponent } from './admin.component';
import {AlertsModule} from '../../alerts/alerts.module';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {BackupService} from '../services/backup.service';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {AppConfig} from '../../app-config/app-config';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async(() => {
    AppConfig.settings = {
      site_name: '',
      database: {name: 'unit-tests', remote_url: '', timeout: 60000, outdated_threshold_days: 0, useTemporaryDatabase: true},
    };

    TestBed.configureTestingModule({
      imports: [AlertsModule, MatSnackBarModule, MatButtonModule, UiHelperModule, HttpClientTestingModule],
      declarations: [ AdminComponent ],
      providers: [
        {provide: BackupService, useValue: new BackupService(null, null)},
        {provide: AppConfig, useValue: { load: () => {} }},
        {provide: EntityMapperService, useValue: jasmine.createSpyObj(['loadType', 'save'])},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
