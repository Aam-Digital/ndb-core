import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { ViewSchoolsComponent } from './view-schools.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import { MockDatabase } from '../../database/mock-database';
import {ChildrenService} from '../children.service';
import {ChangeDetectorRef} from '@angular/core';
import {LoggingService} from '../../logging/logging.service';
import {Database} from '../../database/database';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import { BlobService } from 'app/webdav/blob-service.service';
import { MockBlobService } from 'app/webdav/mock-blob-service';

describe('ViewSchoolsComponent', () => {
  let component: ViewSchoolsComponent;
  let fixture: ComponentFixture<ViewSchoolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSchoolsComponent ],
      imports: [
        MatIconModule,
        MatFormFieldModule,
        MatTableModule,
        MatDialogModule
      ],
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
        MatDialog,
        ChangeDetectorRef,
        LoggingService,
        {provide: Database, useClass: MockDatabase},
        {provide: BlobService, useClass: MockBlobService}
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSchoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
