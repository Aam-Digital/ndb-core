import {Entity} from '../entity/entity';

export class School extends Entity {
  public static ENTITY_TYPE = 'School';

  name = '';
  address = '';
  medium ? = '';
  maxClass?: number;
  remarks ? = '';
  board ? = '';
  schoolTiming = '';
  workDays = '';
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
