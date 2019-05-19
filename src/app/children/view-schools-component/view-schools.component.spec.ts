import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {MatIconModule, MatFormFieldModule, MatTableModule, MatDialogModule, MatDialog} from '@angular/material';

import { ViewSchoolsComponent } from './view-schools.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import { MockDatabase } from '../../database/mock-database';
import {ChildrenService} from '../children.service';
import {ChangeDetectorRef} from '@angular/core';
import {LoggingService} from '../../logging/logging.service';
import {Database} from '../../database/database';

describe('ViewSchoolsComponent', () => {
  let component: ViewSchoolsComponent;
  let fixture: ComponentFixture<ViewSchoolsComponent>;
  const entityMapper = new EntityMapperService(new MockDatabase());

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
        MatDialog,
        ChangeDetectorRef,
        LoggingService,
        { provide: Database, useClass: MockDatabase}
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
