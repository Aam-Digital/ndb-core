import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDayAttendanceComponent } from './add-day-attendance.component';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule,
  MatSelectModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {ChildrenService} from '../../children.service';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {EntityModule} from '../../../entity/entity.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AddDayAttendanceComponent', () => {
  let component: AddDayAttendanceComponent;
  let fixture: ComponentFixture<AddDayAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddDayAttendanceComponent, SchoolBlockComponent, ChildBlockComponent ],
      imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatButtonToggleModule,
        MatIconModule, NoopAnimationsModule,
        EntityModule],
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
