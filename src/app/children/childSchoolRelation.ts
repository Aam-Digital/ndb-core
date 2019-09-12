import {Entity} from '../entity/entity';
import {DatabaseEntity} from '../entity/database-entity.decorator';
import {DatabaseField} from '../entity/database-field.decorator';
import {DatePipe} from '@angular/common';

@DatabaseEntity('ChildSchoolRelation')
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string;
  @DatabaseField() schoolClass: string;
  @DatabaseField() start: Date; // TODO: use Date instead of string?
  @DatabaseField() end: Date; // TODO: use Date instead of string?
  schoolName: string = '';

  // private datePipe: DatePipe;

  // get start_date(): Date {
  //   // console.log(this.start);
  //   return new Date(this.start);
  // }

  // get end_date(): Date {
  //   return new Date(this.end);
  // }

  // set start_date(date) {
  //   // console.log(`Vor Umwandlung: ${date}`);
  //   // console.log("IsNaN: "+ !isNaN(date.getTime()))
  //   // this.start = !isNaN(date.getTime()) ? date.toISOString().slice(0,10) : '';//date.toISOString().slice(0,10);
  //   // console.log(date);
  //   // console.log(date.toISOString().slice(0,10));
  //   this.start = (date !== undefined && !isNaN(date.getDate())) ? date.toISOString().slice(0, 10) : '';
  //   // console.log(`Nach Umwandlung: ${this.start}`);
  // }

  // set end_date(date) {
  //   // console.log(date);
  //   // console.log(date.toISOString().slice(0, 10));
  //   this.end = (date !== undefined && !isNaN(date.getDate())) ? date.toISOString().slice(0, 10) : '';
  // }
  // dummydate = new Date();
}
