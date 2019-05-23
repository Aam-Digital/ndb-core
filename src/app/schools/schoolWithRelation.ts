import {ChildSchoolRelation} from '../children/childSchoolRelation';
import {School} from './school';

export class SchoolWithRelation {
  constructor(private _childSchoolRelation: ChildSchoolRelation, private _school: School) { }

  set childSchoolRelation(value: ChildSchoolRelation) {
    this._childSchoolRelation = value;
  }

  set school(value: School) {
    this._school = value;
  }

  get childSchoolRelation(): ChildSchoolRelation {
    return this._childSchoolRelation;
  }

  get school(): School {
    return this._school;
  }

  getSchoolName(): string {
    return this._school.name;
  }
  getStartTime(): string {
    return this._childSchoolRelation.start;
  }
  getEndTime(): string {
    return this._childSchoolRelation.end;
  }
}
