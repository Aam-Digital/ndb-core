import {Entity} from '../entity/entity';
import {School} from '../schools/schoolsShared/school';
import {Child} from './child';
import {EntityRelation} from '../entity/EntityRelation';
import {EntityMapperService} from '../entity/entity-mapper.service';

export class ChildSchoolRelation extends EntityRelation {
  static ENTITY_TYPE = 'ChildSchoolRelation';

  public childId: string;
  public schoolId: string;
  public class: string;
  public start: string;
  public end: string;

  static getParameterName(type: typeof Entity): string {
    switch (type.ENTITY_TYPE) {
      case School.ENTITY_TYPE: return 'schoolId';
      case Child.ENTITY_TYPE: return 'childId';
    }
    return null;
  }
  getSchool(entityMapperService: EntityMapperService): Promise<School> {
    return entityMapperService.load<School>(School, this.schoolId);
  }
  getChild(entityMapperService: EntityMapperService): Promise<Child> {
    return entityMapperService.load<Child>(Child, this.childId);
  }
}

