import { NotesListComponent } from './notes-list.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {MockDatabase} from '../../database/mock-database';
import {ChildrenService} from '../children.service';
import {SessionService} from '../../session/session.service';
import {MockSessionService} from '../../session/mock-session.service';
import {DatePipe} from '@angular/common';
import {NotesService} from '../../notes/notes.service';

describe('NotesListComponent', () => {
  let entityMapper: EntityMapperService;
  let entitySchemaService: EntitySchemaService;
  let notesListComponent: NotesListComponent;
  let childrenService: ChildrenService;
  let sessionService: SessionService;
  let notesService: NotesService;

  beforeEach(() => {
    entitySchemaService = new EntitySchemaService();
    const database = new MockDatabase();
    entityMapper = new EntityMapperService(database, entitySchemaService);
    childrenService = new ChildrenService(entityMapper, entitySchemaService, database);
    sessionService = new MockSessionService(entitySchemaService);
    notesService = new NotesService(entityMapper);

    notesListComponent = new NotesListComponent(
      null,
      childrenService,
      sessionService,
      new DatePipe('medium'),
      notesService
    );
  });

  it('should create', () => {
    expect(notesService).toBeTruthy();
  });
});
