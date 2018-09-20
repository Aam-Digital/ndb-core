import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMonthAttendanceComponent } from './add-month-attendance.component';
import {
  MatButtonModule,
  MatButtonToggleModule, MatCheckboxModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule, MatProgressBarModule,
  MatSelectModule, MatTableModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';
import {Database} from '../../../database/database';
import {ChildrenService} from '../../children.service';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {AlertsModule} from '../../../alerts/alerts.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AddMonthAttendanceComponent', () => {
  let component: AddMonthAttendanceComponent;
  let fixture: ComponentFixture<AddMonthAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMonthAttendanceComponent, SchoolBlockComponent, ChildBlockComponent ],
      imports: [
        MatButtonToggleModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MatTableModule,
        MatButtonModule,
        MatProgressBarModule,
        FormsModule,
        UiHelperModule,
        AlertsModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntityMapperService,
        { provide: Database, useClass: MockDatabase },
        ChildrenService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMonthAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
