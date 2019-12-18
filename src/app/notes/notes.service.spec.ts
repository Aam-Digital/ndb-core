import {NotesService} from './notes.service';
import {NoteModel} from './note.model';
import {AttendanceModel} from './attendance.model';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {EntitySchemaService} from '../entity/schema/entity-schema.service';
import {MockDatabase} from '../database/mock-database';

function generateNotes() {
  const notes = [];

  const n1 = new NoteModel('1');
  n1.children = [
    new AttendanceModel('1')
  ];
  notes.push(n1);

  const n2 = new NoteModel('2');
  n2.children = [
    new AttendanceModel('1')
  ];
  notes.push(n2);

  const n3 = new NoteModel('3');
  n3.children = [
    new AttendanceModel('3'),
    new AttendanceModel('1'),
    new AttendanceModel('3')
  ];
  notes.push(n3);

  const n4 = new NoteModel('4');
  n4.children = [
    new AttendanceModel('4'),
  ];
  notes.push(n4);

  return notes;
}

describe('NotesService', () => {
  let entityMapper: EntityMapperService;
  let entitySchemaService: EntitySchemaService;
  let service: NotesService;

  let newNote: NoteModel;

  beforeEach(() => {
    entitySchemaService = new EntitySchemaService();
    const database = new MockDatabase();
    entityMapper = new EntityMapperService(database, entitySchemaService);
    generateNotes().forEach(note => entityMapper.save(note));

    service = new NotesService(entityMapper);
    service.getUpdater().subscribe(newNotes => {
      newNote = newNotes[0];
    });
  });

  it('#getNotes() should return correct number of notes', async () => {
    service.getNotesForChild('1').subscribe(async res => {
      expect(res.length).toBe(3);
    });

    service.getNotesForChild('4').subscribe(res => {
      expect(res.length).toBe(1);
    });
  });

});
