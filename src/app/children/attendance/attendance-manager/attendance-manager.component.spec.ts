import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceManagerComponent } from './attendance-manager.component';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatProgressBarModule,
  MatSelectModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {AttendanceBlockComponent} from '../attendance-block/attendance-block.component';
import {AttendanceDayBlockComponent} from '../attendance-days/attendance-day-block.component';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {AttendanceDaysComponent} from '../attendance-days/attendance-days.component';
import {FormsModule} from '@angular/forms';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {ChildrenService} from '../../children.service';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {EntityModule} from '../../../entity/entity.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AttendanceManagerComponent', () => {
  let component: AttendanceManagerComponent;
  let fixture: ComponentFixture<AttendanceManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttendanceManagerComponent, ChildBlockComponent, AttendanceBlockComponent, AttendanceDayBlockComponent,
        AttendanceDaysComponent, SchoolBlockComponent ],
      imports: [ MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatExpansionModule, MatButtonModule, MatTableModule,
        MatProgressBarModule, MatTooltipModule, MatSelectModule, MatIconModule, FormsModule, NoopAnimationsModule,
        UiHelperModule, EntityModule],
      providers: [
        {provide: ChildrenService, useClass: ChildrenService},
        {provide: Database, useClass: MockDatabase},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
