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
import {of, Observable} from 'rxjs';
import { AlertService } from 'app/alerts/alert.service';
import { SchoolsService } from 'app/schools/schools.service';
import { Database } from 'app/database/database';
import { ChildSchoolRelation } from '../childSchoolRelation';
import { ChildrenModule } from '../children.module';
import { RouterTestingModule } from '@angular/router/testing';
import { ExpectedConditions } from 'protractor';

describe('PreviousSchoolsComponent', () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;


  beforeEach(async(() => {
    const route = {paramMap: Observable.create((observer) => {
      const paramMap = {get: () => '22'};
      observer.next(paramMap);
    })};

    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [ ChildrenModule, RouterTestingModule ],
      providers: [
        {provide: Database, useClass: MockDatabase},
        {provide: ActivatedRoute, useValue: route},
        EntityMapperService,
        EntitySchemaService,
        AlertService
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

  it('calls children service with id from route', (done) => {
    const childrenService = fixture.debugElement.injector.get(ChildrenService);
    spyOn(component, 'loadData').and.callThrough();
    spyOn(childrenService, 'getSchoolsWithRelations').and.callThrough();
    component.ngOnInit();
    fixture.whenStable().then(() => {
      expect(component.loadData).toHaveBeenCalledWith('22');
      expect(childrenService.getSchoolsWithRelations).toHaveBeenCalledWith('22');
      done();
    });
  });
});
