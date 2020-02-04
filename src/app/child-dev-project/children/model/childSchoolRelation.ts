import { Entity } from '../../../core/entity/entity';
import { DatabaseEntity } from '../../../core/entity/database-entity.decorator';
import { DatabaseField } from '../../../core/entity/database-field.decorator';


@DatabaseEntity('ChildSchoolRelation')
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string;
  @DatabaseField() schoolClass: string;
  @DatabaseField() start: Date;
  @DatabaseField() end: Date;
  @DatabaseField() result: Number;
}
