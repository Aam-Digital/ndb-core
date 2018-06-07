import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesComponent } from './notes.component';
import {
  MatFormFieldModule,
  MatIconModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTableModule
} from '@angular/material';
import {ChildrenService} from '../children.service';
import {UiHelperModule} from '../../ui-helper/ui-helper.module';
import {ActivatedRoute} from '@angular/router';
import {Child} from '../child';
import {SessionService} from '../../session/session.service';
import {User} from '../../user/user';
import {Observable} from 'rxjs/Observable';

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
  let testUser;


  beforeEach(async(() => {
    testUser = new User('tester');
    testUser.name = 'tester';

    TestBed.configureTestingModule({
      declarations: [ NotesComponent ],
      imports: [MatTableModule, MatFormFieldModule, MatIconModule, MatSnackBarModule, MatSelectModule, UiHelperModule],
      providers: [
        { provide: ActivatedRoute, useValue: {snapshot: {params: {id: '22'}}} },
        { provide: ChildrenService, useValue: mockChildrenService },
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
