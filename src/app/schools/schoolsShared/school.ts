import {Entity} from '../../entity/entity';

export class School extends Entity {
  protected static ENTITY_TYPE = 'School';

  public id: string;
  public name: string;
  public address: string;
  public medium: string;
  public students: Array<any>;
  public max_class?: number;
  public remarks?: string;
  public board?: string;
  public schoolTiming : string;
  public workDays: string;
  public website: string;
  public privateSchool: boolean;
}
