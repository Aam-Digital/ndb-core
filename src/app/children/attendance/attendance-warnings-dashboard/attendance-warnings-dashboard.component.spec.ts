import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceWarningsDashboardComponent } from './attendance-warnings-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {RouterTestingModule} from '@angular/router/testing';
import {MockDatabase} from '../../../database/mock-database';
import {Database} from '../../../database/database';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {ChildrenService} from '../../children.service';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {EntitySchemaService} from '../../../entity/schema/entity-schema.service';

describe('AttendanceWarningsDashboardComponent', () => {
  let component: AttendanceWarningsDashboardComponent;
  let fixture: ComponentFixture<AttendanceWarningsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildBlockComponent, SchoolBlockComponent, AttendanceWarningsDashboardComponent ],
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
    fixture = TestBed.createComponent(AttendanceWarningsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
