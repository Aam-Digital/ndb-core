import { Entity } from '../../../core/entity/entity';
import { DatabaseEntity } from '../../../core/entity/database-entity.decorator';
import { DatabaseField } from '../../../core/entity/database-field.decorator';


@DatabaseEntity('ChildSchoolRelation')
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string;
  @DatabaseField() schoolClass: string;
  @DatabaseField({dataType: 'date-only'}) start: Date;
  @DatabaseField({dataType: 'date-only'}) end: Date;
  @DatabaseField() result: number;
}
