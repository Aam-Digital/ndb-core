import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDayAttendanceComponent } from './add-day-attendance.component';
import { ChildrenService } from '../../children/children.service';
import { Database } from '../../../core/database/database';
import { MockDatabase } from '../../../core/database/mock-database';
import { ChildrenModule } from '../../children/children.module';
import { SchoolsModule } from '../../schools/schools.module';
import { MatNativeDateModule } from '@angular/material/core';
import { CloudFileService } from 'app/core/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/core/webdav/mock-cloud-file-service';

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
        ChildrenService,
        {provide: Database, useClass: MockDatabase},
        {provide: CloudFileService, useClass: MockCloudFileService},
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
