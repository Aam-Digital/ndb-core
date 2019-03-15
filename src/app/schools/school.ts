import {Entity} from '../entity/entity';

export class School extends Entity {
  public static ENTITY_TYPE = 'School';

  public name = '';
  public address = '';
  public medium ? = '';
  public maxClass?: number;
  public remarks ? = '';
  public board ? = '';
  public schoolTiming = '';
  public workDays = '';
  public website = '';
  public privateSchool: boolean;
  public phone = '';
  upToClass: number;
  academicBoard = '';
  timing = '';
  workingDays = '';

  public toString() {
    return this.name;
  }
}
