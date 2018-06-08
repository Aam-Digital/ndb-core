import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildAttendanceComponent } from './child-attendance.component';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {Child} from '../../child';
import {MockDatabaseManagerService} from '../../../database/mock-database-manager.service';
import {ChildrenService} from '../../children.service';
import {UiHelperModule} from '../../../ui-helper/ui-helper.module';
import {DatePipe, PercentPipe} from '@angular/common';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {MockDatabase} from '../../../database/mock-database';

describe('ChildAttendanceComponent', () => {
  let component: ChildAttendanceComponent;
  let fixture: ComponentFixture<ChildAttendanceComponent>;

  const mockChildrenService = {
    getChild: (id) => {
      return Observable.create(function (observer) {
        observer.onNext(new Child('22'));
        observer.onCompleted();
      });
    },
    getAttendances: () => {
      return Observable.create(function (observer) {
        observer.onNext(MockDatabaseManagerService.getDummyDataAttendance());
        observer.onCompleted();
      });
    }
  };

  let mockEntityMapper;


  beforeEach(async(() => {
    mockEntityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ ChildAttendanceComponent ],
      imports: [UiHelperModule],
      providers: [
        DatePipe, PercentPipe,
        { provide: ActivatedRoute, useValue: {params: Observable.of({id: '22'})} },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildAttendanceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
