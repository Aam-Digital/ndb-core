import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteManagerComponent } from './note-manager.component';
import {SessionService} from '../../session/session.service';
import {MockSessionService} from '../../session/mock-session.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {MockDatabase} from '../../database/mock-database';
import {NotesService} from '../notes.service';
import {NoteModel} from '../note.model';

function generateNewNoteModel() {
  const n1 = new NoteModel('1');
  return n1;
}

function generateUpdatedNoteModel() {
  const n1 = new NoteModel('1');
  n1._rev = 'x';
  return n1;
}

describe('NoteManagerComponent', () => {
  let entityMapper: EntityMapperService;
  let entitySchemaService: EntitySchemaService;
  let sessionService: SessionService;
  let notesService: NotesService;
  let noteManager: NoteManagerComponent;

  beforeEach(() => {
    entitySchemaService = new EntitySchemaService();
    const database = new MockDatabase();
    entityMapper = new EntityMapperService(database, entitySchemaService);
    notesService = new NotesService(entityMapper);
    sessionService = new MockSessionService(entitySchemaService);

    noteManager = new NoteManagerComponent(
      null,
      sessionService,
      null,
      notesService
    );
  });

  it('list should be longer after saving a new note', async () =>  {
    notesService.getUpdater().toPromise().then( v => {
      expect(noteManager.entityList.length).toBe(initialLength + 1);
    });

    const initialLength = noteManager.entityList.length;
    notesService.saveNewNote(generateNewNoteModel());
  });

  it('list should not be longer after saving an old note', () => {
    const initialLength = noteManager.entityList.length;
    notesService.saveNewNote(generateUpdatedNoteModel());
    notesService.getUpdater().toPromise().then( v => {
      expect(noteManager.entityList.length).toBe(initialLength);
    });
  });

});
