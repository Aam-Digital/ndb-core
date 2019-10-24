import {Entity} from '../entity/entity';
import {DatabaseEntity} from '../entity/database-entity.decorator';
import {DatabaseField} from '../entity/database-field.decorator';
import {DatePipe} from '@angular/common';

@DatabaseEntity('ChildSchoolRelation')
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string;
  @DatabaseField() schoolClass: string;
  @DatabaseField() start: Date;
  @DatabaseField() end: Date;
  schoolName: string = '';
}
