import {EntitySchemaService} from '../entity/schema/entity-schema.service';
import {async} from '@angular/core/testing';
import {Entity} from '../entity/entity';
import {NoteModel} from './note.model';
import {AttendanceModel} from './attendance.model';
import {InteractionTypes} from './interaction-types.enum';
import {WarningLevel} from '../children/attendance/warning-level';

function createAttendanceModels(): Array<AttendanceModel> {
  const a1 = new AttendanceModel('1').presence(true).remark('not empty');
  const a2 = new AttendanceModel('4').presence(false).remark('remark one');
  const a3 = new AttendanceModel('7').presence(true).remark('');

  return [a1, a2, a3];
}

function createTestModel(): NoteModel {
  const n1 = new NoteModel('2');
  n1.children = createAttendanceModels();
  n1.date = new Date();
  n1.subject = 'Note Subject';
  n1.text = 'Note text';
  n1.author = 'Max Musterman';
  n1.category = InteractionTypes.DISCUSSION;
  n1.warningLevel = WarningLevel.URGENT;

  return n1;
}

const testNote = createTestModel();

describe('NoteModel', () => {
  const ENTITY_TYPE = 'Note';
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));


  it('has correct _id and entityId and type', function () {
    const id = 'test1';
    const entity = new NoteModel(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new NoteModel(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it('has all and only defined schema fields in rawData', function () {
    const id = '1';
    const expectedData = {
      _id: ENTITY_TYPE + ':' + id,

      children: [new AttendanceModel('1'), new AttendanceModel('2'), new AttendanceModel('5')],
      date: new Date(),
      subject: 'Note Subject',
      text: 'Note text',
      author: 'Max Musterman',
      category: InteractionTypes.DISCUSSION,
      warningLevel: WarningLevel.URGENT,

      searchIndices: []
    };

    const entity = new NoteModel(id);
    Object.assign(entity, expectedData);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it('should return the correct linked children', function () {
    expect(testNote.isLinkedWithChild('1')).toBe(true);
    expect(testNote.isLinkedWithChild('2')).toBe(false);
  });

  it('should return the correct presence behaviour', function () {
    expect(testNote.childrenWithPresence(true).length).toBe(2);
    expect(testNote.childrenWithPresence(false).length).toBe(1);

    expect(testNote.isPresent('1')).toBe(true);
    expect(testNote.isPresent('4')).toBe(false);
  });

  it('should return the correct childIds', function () {
    expect(testNote.getChildIDs()).toEqual(['1', '4', '7']);
  });

  it('should shrink in size after removing', function () {
    const previousLength = testNote.children.length;
    testNote.removeChild('1');
    expect(testNote.children.length).toBe(previousLength - 1);
  });

  it('should increase in size after adding', function () {
    const previousLength = testNote.children.length;
    testNote.addChildren('2', '5');
    expect(testNote.children.length).toBe(previousLength + 2);
  });

  it('should toggle presence', function () {
    testNote.togglePresence('1');
    expect(testNote.children[0].present).toBe(false);
  });

});
