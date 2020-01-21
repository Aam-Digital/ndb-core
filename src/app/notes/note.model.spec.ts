import {EntitySchemaService} from '../entity/schema/entity-schema.service';
import {async} from '@angular/core/testing';
import {Entity} from '../entity/entity';
import {NoteModel} from './note.model';
import {AttendanceModel} from './attendance.model';
import {InteractionTypes} from './interaction-types.enum';
import {WarningLevel} from '../children/attendance/warning-level';

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
    entity.children = expectedData.children;
    entity.date = expectedData.date;
    entity.subject = expectedData.subject;
    entity.text = expectedData.text;
    entity.author = expectedData.author;
    entity.category = expectedData.category;
    entity.warningLevel = expectedData.warningLevel;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });
});
