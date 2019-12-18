import {NoteDetailComponent} from './note-detail.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';
import {NotesService} from '../notes.service';
import {NoteModel} from '../note.model';
import {AttendanceModel} from '../attendance.model';
import {InteractionTypes} from '../interaction-types.enum';
import {ComponentFixture, TestBed} from '@angular/core/testing';

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

  let component: NoteDetailComponent;
  let fixture: ComponentFixture<NoteDetailComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ NoteDetailComponent ],
      imports: [],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        NotesService
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
