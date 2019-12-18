import {NoteDetailComponent} from './note-detail.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {NotesService} from '../notes.service';
import {MockDatabase} from '../../database/mock-database';
import {NoteModel} from '../note.model';
import {AttendanceModel} from '../attendance.model';
import {InteractionTypes} from '../interaction-types.enum';

function generateChildAttendanceModels() {
  const attendances = [];
  let i;
  for (i = 1; i < 4; i++) {
    const am = new AttendanceModel('' + i);
    if (i % 2 === 0) {
      am.present = false;
      am.remarks = 'not empty';
    }
    attendances.push(am);
  }
  return attendances;
}

function generateMeetingNoteModel() {
  const n1 = new NoteModel('1');
  n1.children = generateChildAttendanceModels();
  n1.category = InteractionTypes.CHILDREN_MEETING;
  return n1;
}

describe('NoteDetailComponent', () => {
  let entityMapper: EntityMapperService;
  let entitySchemaService: EntitySchemaService;
  let notesService: NotesService;

  let component: NoteDetailComponent;

  beforeEach((() => {
    entitySchemaService = new EntitySchemaService();
    const database = new MockDatabase();
    entityMapper = new EntityMapperService(database, entitySchemaService);
    notesService = new NotesService(entityMapper);

    component = new NoteDetailComponent(
      generateChildAttendanceModels(),
      null,
      null,
      entityMapper,
      notesService
    );
  }));

  it('should ', function () {

  });
});
