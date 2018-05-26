import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildAttendanceComponent } from './child-attendance.component';
import {MatFormFieldModule, MatIconModule, MatSnackBarModule, MatTableModule} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {Child} from '../../child';
import {MockDatabaseManagerService} from '../../../database/mock-database-manager.service';
import {ChildrenService} from '../../children.service';

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildAttendanceComponent ],
      imports: [MatTableModule, MatFormFieldModule, MatIconModule, MatSnackBarModule],
      providers: [
        { provide: ActivatedRoute, useValue: {params: Observable.of({id: '22'})} },
        { provide: ChildrenService, useValue: mockChildrenService } ],
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
