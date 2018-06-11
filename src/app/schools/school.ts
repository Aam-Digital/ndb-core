import {Entity} from '../entity/entity';

export class School extends Entity {
  static ENTITY_TYPE = 'School';

  name = '';
  medium = '';
  governmentSchool: boolean;
  academicBoard = '';
  upToClass: number;

  timing = '';
  workingDays = '';
  sessionStart = '';

  remarks = '';

  address = '';
  website = '';
}
