import {Entity} from '../entity/entity';
import {School} from '../schools/schoolsShared/school';
import {Child} from './child';

export abstract class Relation extends Entity {
  static getParameterName<T extends Entity>(type: typeof Entity): string {
    return null;
  }
}

export class ChildSchoolRelation extends Relation {
  static ENTITY_TYPE = 'ChildSchoolRelation';

  public childId: string;
  public schoolId: string;
  public class: string;
  public start: Date;
  public end: Date;

  static getParameterName(type: typeof Entity): string {
    switch (type.ENTITY_TYPE) {
      case School.ENTITY_TYPE: return 'schoolId';
      case Child.ENTITY_TYPE: return 'childId';
    }
    return null;
  }
}

