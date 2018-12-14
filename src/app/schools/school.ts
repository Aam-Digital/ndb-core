import {Entity} from '../entity/entity';

export class School extends Entity {
  static ENTITY_TYPE = 'School';

  name = '';
  medium = '';
  privateSchool: boolean;
  academicBoard = '';
  upToClass: number;

  timing = '';
  workingDays = '';
  sessionStart = '';

  remarks = '';

  address = '';
  website = '';


  public toString() {
    return this.name;
  }
}
