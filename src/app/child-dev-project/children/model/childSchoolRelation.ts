import {Entity} from '../../../core/entity/entity';
import {DatabaseEntity} from '../../../core/entity/database-entity.decorator';
import {DatabaseField} from '../../../core/entity/database-field.decorator';

@DatabaseEntity('ChildSchoolRelation')
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string;
  @DatabaseField() schoolClass: string;
  @DatabaseField() start: string; // TODO: use Date instead of string?
  @DatabaseField() end: string; // TODO: use Date instead of string?
}

