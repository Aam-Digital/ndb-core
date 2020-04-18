import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousSchoolsComponent } from './previous-schools.component';
import { ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../../child-dev-project/children/children.service';
import { EntityMapperService } from '../../core/entity/entity-mapper.service';
import { EntitySchemaService } from '../../core/entity/schema/entity-schema.service';
import { MockDatabase } from '../../core/database/mock-database';
import { Observable } from 'rxjs';
import { AlertService } from '../../core/alerts/alert.service';
import { Database } from '../../core/database/database';
import { ChildrenModule } from '../../child-dev-project/children/children.module';
import { RouterTestingModule } from '@angular/router/testing';
import { SchoolsService } from '../../child-dev-project/schools/schools.service';
import { SessionService } from 'app/core/session/session.service';
import { CloudFileService } from 'app/core/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/core/webdav/mock-cloud-file-service';
import { ChildDetailsComponent } from '../children/child-details/child-details.component';

describe('PreviousSchoolsComponent', () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  const mockedSession = { getCurrentUser: () => 'testUser' };


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
        { provide: SessionService, useValue: mockedSession },
        EntityMapperService,
        EntitySchemaService,
        AlertService,
        SchoolsService,
        ChildDetailsComponent,
        { provide: CloudFileService, useClass: MockCloudFileService },
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
