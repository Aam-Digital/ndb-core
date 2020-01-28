import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDayAttendanceComponent } from './add-day-attendance.component';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { SchoolBlockComponent } from '../../schools/school-block/school-block.component';
import { ChildBlockComponent } from '../../children/child-block/child-block.component';
import { ChildrenService } from '../../children/children.service';
import { Database } from '../../../core/database/database';
import { MockDatabase } from '../../../core/database/mock-database';
import { EntityModule } from '../../../core/entity/entity.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CloudFileService } from 'app/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/webdav/mock-cloud-file-service';

describe('AddDayAttendanceComponent', () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDayAttendanceComponent, SchoolBlockComponent, ChildBlockComponent ],
      imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatButtonToggleModule,
        MatIconModule, MatProgressBarModule, MatDatepickerModule, MatNativeDateModule, NoopAnimationsModule,
        EntityModule],
      providers: [
        ChildrenService,
        {provide: Database, useClass: MockDatabase},
        {provide: CloudFileService, useClass: MockCloudFileService}
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
