import {Entity} from '../../entity/entity';

export class School extends Entity {
  public static ENTITY_TYPE = 'School';

  public name: string;
  public address: string;
  public medium: string;
  public students: Array<any>;
  public maxClass?: number;
  public remarks?: string;
  public board?: string;
  public schoolTiming: string;
  public workDays: string;
  public website: string;
  public privateSchool: boolean;
}
