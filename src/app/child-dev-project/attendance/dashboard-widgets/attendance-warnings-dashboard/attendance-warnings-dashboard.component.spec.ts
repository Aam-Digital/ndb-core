import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceWarningsDashboardComponent } from './attendance-warnings-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ChildBlockComponent } from '../../../children/child-block/child-block.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockDatabase } from '../../../../core/database/mock-database';
import { Database } from '../../../../core/database/database';
import { EntityMapperService } from '../../../../core/entity/entity-mapper.service';
import { ChildrenService } from '../../../children/children.service';
import { SchoolBlockComponent } from '../../../schools/school-block/school-block.component';
import { EntitySchemaService } from '../../../../core/entity/schema/entity-schema.service';
import { CloudFileService } from 'app/core/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/core/webdav/mock-cloud-file-service';

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
        {provide: CloudFileService, useClass: MockCloudFileService},
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
