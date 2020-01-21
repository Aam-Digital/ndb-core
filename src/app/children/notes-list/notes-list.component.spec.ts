import { NotesListComponent } from './notes-list.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NotesModule} from '../../notes/notes.module';
import {MatNativeDateModule} from '@angular/material/core';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {ChildrenService} from '../children.service';
import {SessionService} from '../../session/session.service';
import {Database} from '../../database/database';
import {MockDatabase} from '../../database/mock-database';
import {DatePipe} from '@angular/common';
import {NoteModel} from '../../notes/note.model';
import {RouterTestingModule} from '@angular/router/testing';
import {Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

const mockedRoute = {
  paramMap: Observable.create((observer) => observer.next({
    get: (x) => '1'
  }))
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
        SessionService,
        {provide: Database, useClass: MockDatabase},
        EntitySchemaService,
        EntityMapperService,
        {provide: DatePipe, useValue: new DatePipe('medium')},
        {provide: ActivatedRoute, useValue: mockedRoute}]
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
    const entityMapperService = fixture.debugElement.injector.get(EntityMapperService);
    await fixture.whenStable();
    expect(component.records).toEqual(allChildren);
  });

});
