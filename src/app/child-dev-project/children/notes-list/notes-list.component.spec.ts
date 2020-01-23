import { NotesListComponent } from './notes-list.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotesModule } from '../../notes/notes.module';
import { MatNativeDateModule } from '@angular/material/core';
import { ChildrenService } from '../children.service';
import { DatePipe } from '@angular/common';
import { NoteModel } from '../../notes/note.model';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../../../core/session/session.service';
import { EntityMapperService } from '../../../core/entity/entity-mapper.service';
import { MockDatabase } from '../../../core/database/mock-database';
import { EntitySchemaService } from '../../../core/entity/schema/entity-schema.service';
import { Database } from '../../../core/database/database';
import { User } from '../../../core/user/user';

const mockedRoute = {
  paramMap: Observable.create((observer) => observer.next({
    get: (x) => '1',
  })),
};

const mockedSessionService = {
  getCurrentUser(): User {
    return new User('1');
  },
};

const allChildren: Array<NoteModel> = [];

describe('NotesListComponent', () => {

  let component: NotesListComponent;
  let fixture: ComponentFixture<NotesListComponent>;

  beforeEach(async () => {

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        NotesModule,
        MatNativeDateModule,
        RouterTestingModule],
      providers: [
        ChildrenService,
        EntitySchemaService,
        EntityMapperService,
        {provide: SessionService, useValue: mockedSessionService},
        {provide: Database, useClass: MockDatabase},
        {provide: DatePipe, useValue: new DatePipe('medium')},
        {provide: ActivatedRoute, useValue: mockedRoute}],
      })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesListComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should load initial notes', async () => {
    await fixture.whenStable();
    expect(component.records).toEqual(allChildren);
  });

  it('should create a new note', function () {
    const newNoteFactory = component.generateNewRecordFactory();
    expect(newNoteFactory).toBeDefined();
  });

});
