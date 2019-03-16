import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
} from '@angular/material';

import { EditSchoolDialogComponent } from './edit-school-dialog.component';
import {FormsModule} from '@angular/forms';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Child} from '../../child';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('EditSchoolDialogComponent', () => {
  let component: EditSchoolDialogComponent;
  let fixture: ComponentFixture<EditSchoolDialogComponent>;

  beforeEach(async(() => {
    const entityMapper = new EntityMapperService(new MockDatabase());
    TestBed.configureTestingModule({
      declarations: [ EditSchoolDialogComponent ],
      imports: [
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [
        {provide: EntityMapperService, useValue: entityMapper},
        {provide: MatDialogRef, useValue: MatDialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {child: new Child('')}},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSchoolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
