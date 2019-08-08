import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolDetailComponent } from './school-detail.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import {MatExpansionModule} from '@angular/material/expansion';
import {SchoolsService} from '../schools.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import { Location } from '@angular/common';
import {Observable} from 'rxjs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import * as uniqid from 'uniqid';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service'; //  Necessary for usage of uniqid in the component

describe('SchoolDetailComponent', () => {
  let component: SchoolDetailComponent;
  let fixture: ComponentFixture<SchoolDetailComponent>;
  const mockedRoute = {snapshot: { params: { id: 'new' } } };
  const mockedRouter = {navigate: () => null};
  const mockedLocation = {back: () => null};
  const mockedSnackBar = {open: () => { return {
    onAction: () => Observable.create(observer => observer.next())
  }; }};
  const mockedConfirmationDialog = { openDialog: () => { return {
      afterClosed: () => Observable.create(observer => observer(false))
  }; }};

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
        MatInputModule,
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        SchoolsService,
        AlertService,
        FormBuilder,
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
