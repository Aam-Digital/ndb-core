import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceDetailsComponent } from './attendance-details.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AttendanceDaysComponent} from '../attendance-days/attendance-days.component';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {ChildrenService} from '../../children.service';
import {AttendanceMonth} from '../attendance-month';
import {EntityModule} from '../../../entity/entity.module';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AttendanceDetailsComponent', () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(async(() => {
    const att = new AttendanceMonth('test');
    att.month = new Date();

    TestBed.configureTestingModule({
      declarations: [ AttendanceDetailsComponent, ChildBlockComponent, AttendanceDaysComponent, SchoolBlockComponent ],
      imports: [ MatFormFieldModule, MatInputModule, MatDialogModule, MatSelectModule, MatIconModule,
        FormsModule, CommonModule, RouterTestingModule, NoopAnimationsModule,
        UiHelperModule, EntityModule],
      providers: [
        {provide: Database, useClass: MockDatabase},
        {provide: MatDialogRef, useValue: {beforeClose: () => { return { subscribe: () => {}}}}},
        {provide: MAT_DIALOG_DATA, useValue: {entity: att}},
        {provide: ChildrenService, useClass: ChildrenService},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
