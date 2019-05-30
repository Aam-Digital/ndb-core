import {Entity} from '../entity/entity';

export class School extends Entity {
  public static ENTITY_TYPE = 'School';
  static schema = Entity.schema.extend({
    'name': 'string=',
    'address': 'string=',
    'medium': 'string=',
    'remarks': 'string=',
    'website': 'string=',
    'privateSchool': 'boolean',
    'phone': 'string=',
    'upToClass': 'number',
    'academicBoard': 'string=',
    'timing': 'string=',
    'workingDays': 'string=',
  });

  name = '';
  address = '';
  medium ? = '';
  remarks ? = '';
  website = '';
  privateSchool: boolean;
  phone = '';
  upToClass: number;
  academicBoard = '';
  timing = '';
  workingDays = '';

  public toString() {
    return this.name;
  }
}
