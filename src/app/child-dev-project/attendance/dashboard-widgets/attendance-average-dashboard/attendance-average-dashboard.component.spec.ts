import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceAverageDashboardComponent } from './attendance-average-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ChildrenService } from '../../../children/children.service';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { Database } from '../../../../core/database/database';
import { MockDatabase } from '../../../../core/database/mock-database';
import { ChildBlockComponent } from '../../../children/child-block/child-block.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SchoolBlockComponent } from '../../../schools/school-block/school-block.component';
import { EntitySchemaService } from '../../../../core/entity/schema/entity-schema.service';

describe('AttendanceAverageDashboardComponent', () => {
  let component: AttendanceAverageDashboardComponent;
  let fixture: ComponentFixture<AttendanceAverageDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildBlockComponent, SchoolBlockComponent, AttendanceAverageDashboardComponent],
      imports: [MatIconModule, MatCardModule, RouterTestingModule],
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceAverageDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
