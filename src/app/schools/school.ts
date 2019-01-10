import {Entity} from '../entity/entity';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {Child} from '../children/child';
import {ChildSchoolRelation} from '../children/childSchoolRelation';

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



  getStudents(entityMapperService: EntityMapperService): Promise<Child[]> {
    return entityMapperService.loadTypeForRelation<School, Child, ChildSchoolRelation>(
      School,
      Child,
      ChildSchoolRelation,
      this.getId())
  }

  public toString() {
    return this.name;
  }
}
