import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesComponent } from './notes.component';
import {ChildrenService} from '../children.service';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {ActivatedRoute} from '@angular/router';
import {Child} from '../child';
import {SessionService} from '../../session/session.service';
import {User} from '../../user/user';
import {Observable} from 'rxjs/Observable';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MockDatabase} from '../../database/mock-database';
import {DatePipe} from '@angular/common';

describe('NotesComponent', () => {
  let component: NotesComponent;
  let fixture: ComponentFixture<NotesComponent>;

  const mockChildrenService = {
    getChild: (id) => {
      return Observable.of([new Child('22')]);
    },
    getNotesOfChild: (id) => {
      return Observable.of([]);
    }
  };
  let mockEntityMapper;
  let testUser;


  beforeEach(async(() => {
    testUser = new User('tester');
    testUser.name = 'tester';

    mockEntityMapper = new EntityMapperService(new MockDatabase());

    TestBed.configureTestingModule({
      declarations: [ NotesComponent ],
      imports: [UiHelperModule],
      providers: [
        DatePipe,
        { provide: ActivatedRoute, useValue: {snapshot: {params: {id: '22'}}} },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: SessionService, useValue: { getCurrentUser() { return testUser; }} },
        ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
