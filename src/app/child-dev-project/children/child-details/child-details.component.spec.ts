import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { AlertService } from '../../../core/alerts/alert.service';
import { ConfirmationDialogService } from '../../../core/ui-helper/confirmation-dialog/confirmation-dialog.service';
import { DatePipe, Location, PercentPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ChildDetailsComponent } from './child-details.component';
import { SchoolBlockComponent } from '../../schools/school-block/school-block.component';
import { AserComponent } from '../../aser/aser-component/aser.component';
import { ChildAttendanceComponent } from '../../attendance/child-attendance/child-attendance.component';
import { NotesComponent } from '../notes/notes.component';
import { EducationalMaterialComponent } from '../../educational-material/educational-material-component/educational-material.component';
import { KeysPipe } from '../../../core/ui-helper/keys-pipe/keys.pipe';
import { EntitySubrecordComponent } from '../../../core/ui-helper/entity-subrecord/entity-subrecord.component';
import { AttendanceDaysComponent } from '../../attendance/attendance-days/attendance-days.component';
import { AttendanceDayBlockComponent } from '../../attendance/attendance-days/attendance-day-block.component';
import { ChildrenService } from '../children.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HealthCheckupComponent } from '../../health-checkup/health-checkup-component/health-checkup.component';
import { databaseServiceProvider } from 'app/core/session/database.service.provider';
import { SessionService } from 'app/core/session/session.service';
import { EntitySchemaService } from '../../../core/entity/schema/entity-schema.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MockDatabase } from 'app/core/database/mock-database';
import { PreviousSchoolsComponent } from 'app/child-dev-project/previous-schools/previous-schools.component';
import { SchoolsService } from 'app/child-dev-project/schools/schools.service';
import { ChildPhotoService } from '../child-photo-service/child-photo.service';

describe('ChildDetailsComponent', () => {
  let component: ChildDetailsComponent;
  let fixture: ComponentFixture<ChildDetailsComponent>;
  const mockedRoute = {paramMap: Observable.create(observer => observer.next({get: () => 'new'})) };
  const mockedRouter = {navigate: () => null};
  const mockedLocation = {back: () => null};
  const mockedSnackBar = {open: () => { return {
      onAction: () => Observable.create(observer => observer.next()),
    }; }};
  const mockedConfirmationDialog = { openDialog: () => { return {
      afterClosed: () => Observable.create(observer => observer(false)),
    }; }};
  const mockedDialog = { open: () => { return {
      afterClosed: () => Observable.create(observer => observer(false)),
    }; }};
  const mockedDatabase = new MockDatabase();
  const mockedSession = { getCurrentUser: () => 'testUser', getDatabase: () => mockedDatabase };
  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;

  beforeEach(async(() => {
    mockChildPhotoService = jasmine.createSpyObj('mockChildPhotoService', ['canSetImage', 'setImage']);

    TestBed.configureTestingModule({
      declarations: [
        ChildDetailsComponent,
        SchoolBlockComponent,
        AserComponent,
        ChildAttendanceComponent,
        NotesComponent,
        EducationalMaterialComponent,
        KeysPipe,
        EntitySubrecordComponent,
        AttendanceDaysComponent,
        AttendanceDayBlockComponent,
        HealthCheckupComponent,
        PreviousSchoolsComponent,
      ],
      imports: [
        MatTableModule,
        MatFormFieldModule,
        MatSortModule,
        MatExpansionModule,
        MatIconModule,
        MatSelectModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        MatInputModule,
        FormsModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        BrowserAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        ChildrenService,
        AlertService,
        DatePipe,
        PercentPipe,
        databaseServiceProvider,
        { provide: SessionService, useValue: mockedSession },
        { provide: MatDialog, useValue: mockedDialog },
        { provide: ConfirmationDialogService, useValue: mockedConfirmationDialog},
        { provide: MatSnackBar, useValue: mockedSnackBar},
        { provide: Location, useValue: mockedLocation},
        { provide: Router, useValue: mockedRouter},
        { provide: ActivatedRoute, useValue: mockedRoute},
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
        FormBuilder,
        SchoolsService,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    mockChildPhotoService.canSetImage.and.returnValue(false);
    expect(component).toBeTruthy();
  });

  it('should create with edit mode', () => {
    mockChildPhotoService.canSetImage.and.returnValue(true);
    component.switchEdit();

    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});
