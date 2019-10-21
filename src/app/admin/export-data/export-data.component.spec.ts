import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportDataComponent } from './export-data.component';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {BackupService} from '../services/backup.service';
import {PapaParseModule} from 'ngx-papaparse';

describe('ExportDataComponent', () => {
  let component: ExportDataComponent;
  let fixture: ComponentFixture<ExportDataComponent>;

  beforeEach(async(() => {
    const db = new MockDatabase();
    TestBed.configureTestingModule({
      imports: [PapaParseModule],
      declarations: [ ExportDataComponent ],
      providers: [
        BackupService,
        {provide: Database, useValue: db},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates a link element when pressing export button', () => {
    component.exportData();
    const link = document.getElementById('download-link');
    expect(link).toBeTruthy();
  })
});
