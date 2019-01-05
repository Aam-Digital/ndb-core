import {Entity} from '../entity/entity';

export class ChildSchoolRelation extends Entity {
  static ENTITY_TYPE = 'ChildSchoolRelation';

  public childId: string;
  public schoolId: string;
  public schoolClass: string;
  public start: Date;
  public end: Date;
}
