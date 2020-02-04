import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDayAttendanceComponent } from './add-day-attendance.component';
import { ChildrenService } from '../../children/children.service';
import { Database } from '../../../core/database/database';
import { MockDatabase } from '../../../core/database/mock-database';
import { ChildrenModule } from '../../children/children.module';
import { SchoolsModule } from '../../schools/schools.module';
import { MatNativeDateModule } from '@angular/material/core';

describe('AddDayAttendanceComponent', () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ChildrenModule,
        SchoolsModule,
        MatNativeDateModule,
      ],
      providers: [
        {provide: ChildrenService, useClass: ChildrenService},
        {provide: Database, useClass: MockDatabase},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDayAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
