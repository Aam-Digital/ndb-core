import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousSchoolsComponent } from './previous-schools.component';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ChildrenService} from '../children.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {MockDatabase} from '../../database/mock-database';
import {Child} from '../child';
import {DatePipe} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import { AlertService } from 'app/alerts/alert.service';
import { SchoolsService } from 'app/schools/schools.service';
import { Database } from 'app/database/database';

describe('PreviousSchoolsComponent', () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  const mockChildrenService = {
    getChild: (id) => {
      return of([new Child('22')]);
    },
    // getPreviousSchoolsOfChild: (id) => {
    //   return of([]);
    // }
  };
  let mockEntityMapper;


  beforeEach(async(() => {
    mockEntityMapper = new EntityMapperService(new MockDatabase(), new EntitySchemaService());

    TestBed.configureTestingModule({
      declarations: [ PreviousSchoolsComponent ],
      imports: [ UiHelperModule, FormsModule, NoopAnimationsModule],
      providers: [
        DatePipe,
        { provide: ActivatedRoute, useValue: {paramMap: of({get: () => '22'}) } },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        AlertService,
        SchoolsService,
        EntitySchemaService,
        Database,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousSchoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
