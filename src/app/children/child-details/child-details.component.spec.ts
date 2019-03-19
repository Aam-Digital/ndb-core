import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  MatFormFieldModule,
  MatIconModule,
  MatSortModule,
  MatTableModule,
  MatInputModule,
  MatSelectModule,
  MatAutocompleteModule,
  MatTooltipModule, MatDialog,
} from '@angular/material';
import {MatExpansionModule} from '@angular/material/expansion';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {DatePipe, Location, PercentPipe} from '@angular/common';
import {Observable} from 'rxjs';
import * as uniqid from 'uniqid'; //  Necessary for usage of uniqid in the component
import {ChildDetailsComponent} from './child-details.component';
import {ViewSchoolsComponent} from '../view-schools-component/view-schools.component';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import {AserComponent} from '../aser/aser.component';
import {ChildAttendanceComponent} from '../attendance/child-attendance/child-attendance.component';
import {NotesComponent} from '../notes/notes.component';
import {EducationalMaterialComponent} from '../educational-material/educational-material.component';
import {KeysPipe} from '../../ui-helper/keys-pipe/keys.pipe';
import {EntitySubrecordComponent} from '../../ui-helper/entity-subrecord/entity-subrecord.component';
import {AttendanceDaysComponent} from '../attendance/attendance-days/attendance-days.component';
import {AttendanceDayBlockComponent} from '../attendance/attendance-days/attendance-day-block.component';
import {ChildrenService} from '../children.service';
import {MatSnackBar} from '@angular/material';
import {SessionService} from '../../session/session.service';
import {DatabaseManagerService} from '../../database/database-manager.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('ChildDetailsComponent', () => {
  let component: ChildDetailsComponent;
  let fixture: ComponentFixture<ChildDetailsComponent>;
  const mockedRoute = {paramMap: Observable.create(observer => observer.next({get: () => 'new'})) };
  const mockedRouter = {navigate: () => null};
  const mockedLocation = {back: () => null};
  const mockedSnackBar = {open: () => { return {
      onAction: () => Observable.create(observer => observer.next())
    }}};
  const mockedConfirmationDialog = { openDialog: () => { return {
      afterClosed: () => Observable.create(observer => observer(false))
    }}};
  const mockedDialog = { open: () => { return {
      afterClosed: () => Observable.create(observer => observer(false))
    }}};
  const mockedSession = { getCurrentUser: () => 'testUser'};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ChildDetailsComponent,
        ViewSchoolsComponent,
        SchoolBlockComponent,
        AserComponent,
        ChildAttendanceComponent,
        NotesComponent,
        EducationalMaterialComponent,
        KeysPipe,
        EntitySubrecordComponent,
        AttendanceDaysComponent,
        AttendanceDayBlockComponent,
      ],
      imports: [
        MatTableModule,
        MatFormFieldModule,
        MatSortModule,
        MatExpansionModule,
        MatIconModule,
        MatSelectModule,
        MatTooltipModule,
        ReactiveFormsModule,
        MatInputModule,
        FormsModule,
        MatAutocompleteModule,
        BrowserAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        ChildrenService,
        AlertService,
        DatePipe,
        PercentPipe,
        { provide: SessionService, useValue: mockedSession},
        DatabaseManagerService,
        { provide: MatDialog, useValue: mockedDialog },
        { provide: ConfirmationDialogService, useValue: mockedConfirmationDialog},
        { provide: MatSnackBar, useValue: mockedSnackBar},
        { provide: Location, useValue: mockedLocation},
        { provide: Router, useValue: mockedRouter},
        { provide: ActivatedRoute, useValue: mockedRoute},
        { provide: Database, useClass: MockDatabase},
        FormBuilder,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
