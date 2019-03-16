import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolDetailComponent } from './school-detail.component';
import {
  MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatSortModule,
  MatTableModule,
  MatSnackBar,
  MatDialog
} from '@angular/material';
import {MatExpansionModule} from '@angular/material/expansion';
import {SchoolsService} from '../schools.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import { Location } from '@angular/common';
import {Observable} from 'rxjs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('SchoolDetailComponent', () => {
  let component: SchoolDetailComponent;
  let fixture: ComponentFixture<SchoolDetailComponent>;
  const mockedRoute = {snapshot: { params: { id: 'new' } } };
  const mockedRouter = {navigate: () => null};
  const mockedLocation = {back: () => null};
  const mockedSnackBar = {open: () => { return {
    onAction: () => Observable.create(observer => observer.next())
  }}};
  const mockedConfirmationDialog = { openDialog: () => { return {
      afterClosed: () => Observable.create(observer => observer(false))
  }}};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchoolDetailComponent ],
      imports: [
        MatTableModule,
        MatFormFieldModule,
        MatSortModule,
        MatExpansionModule,
        MatIconModule,
        MatCheckboxModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        SchoolsService,
        AlertService,
        { provide: ConfirmationDialogService, useValue: mockedConfirmationDialog},
        { provide: MatSnackBar, useValue: mockedSnackBar},
        { provide: Location, useValue: mockedLocation},
        { provide: Router, useValue: mockedRouter},
        { provide: ActivatedRoute, useValue: mockedRoute},
        { provide: Database, useClass: MockDatabase}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // TODO: find a way to mock/import uniqid, the rest should work
  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
