import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildrenListComponent } from './children-list.component';
import {
  MatButtonModule, MatButtonToggleModule,
  MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSidenavModule,
  MatSortModule,
  MatTableModule, MatTooltipModule
} from '@angular/material';
import {CommonModule} from '@angular/common';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {Database} from '../../database/database';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AttendanceBlockComponent} from '../attendance/attendance-block/attendance-block.component';
import {FormsModule} from '@angular/forms';
import {ChildBlockComponent} from '../child-block/child-block.component';
import {SchoolBlockComponent} from '../../schools/school-block/school-block.component';
import {FilterPipeModule} from 'ngx-filter-pipe';
import {AttendanceDaysComponent} from '../attendance/attendance-days/attendance-days.component';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {AttendanceDayBlockComponent} from '../attendance/attendance-days/attendance-day-block.component';

describe('ChildrenListComponent', () => {
  let component: ChildrenListComponent;
  let fixture: ComponentFixture<ChildrenListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildBlockComponent, SchoolBlockComponent, AttendanceBlockComponent, ChildrenListComponent,
        AttendanceDaysComponent, AttendanceDayBlockComponent ],
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatExpansionModule,
        MatTableModule,
        MatSortModule,
        MatSidenavModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatTooltipModule,
        NoopAnimationsModule,
        FormsModule,
        FilterPipeModule,
        RouterTestingModule.withRoutes([
          { path: 'child', component: ChildrenListComponent}
        ]),
        UiHelperModule,
      ],
      providers: [ChildrenService, EntityMapperService, { provide: Database, useClass: MockDatabase }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
