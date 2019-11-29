import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceAverageDashboardComponent } from './attendance-average-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {ChildrenService} from '../../children.service';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {Database} from '../../../database/database';
import {MockDatabase} from '../../../database/mock-database';
import {ChildBlockComponent} from '../../child-block/child-block.component';
import {RouterTestingModule} from '@angular/router/testing';
import {SchoolBlockComponent} from '../../../schools/school-block/school-block.component';
import {EntitySchemaService} from '../../../entity/schema/entity-schema.service';
import { BlobService } from 'app/webdav/blob-service.service';
import { MockBlobService } from 'app/webdav/mock-blob-service';

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
        { provide: BlobService, useClass: MockBlobService }
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
