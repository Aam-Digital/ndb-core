import {Entity} from '../entity/entity';

export class ChildSchoolRelation extends Entity {
  static ENTITY_TYPE = 'ChildSchoolRelation';
  static schema = Entity.schema.extend({
    'childId': 'string',
    'schoolId': 'string',
    'schoolClass': 'string',
    'start': 'string',
    'end': 'string',
  });

  public childId: string;
  public schoolId: string;
  public schoolClass: string;
  public start: string; // TODO: use Date instead of string?
  public end: string; // TODO: use Date instead of string?
}

