/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Entity } from '../entity/entity';
import { Gender} from './Gender';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {ChildSchoolRelation} from './childSchoolRelation';
import {School} from '../schools/schoolsShared/school';


export class Child extends Entity {
  static ENTITY_TYPE = 'Child';

  name: string;
  projectNumber: string; // project number
  gender: Gender; // M or F
  dateOfBirth: Date;
  motherTongue = '';
  religion = '';
  school: string;

  hasPhoto = true;

  center = '';
  admissionDate: Date;
  status = '';

  schoolId: string;
  schoolClass = '';

  address = '';
  phone = '';
  guardianName = '';
  preferredTimeForGuardianMeeting = '';

  has_aadhar = '';
  has_bankAccount = '';
  has_kanyashree = '';
  has_rationCard = '';
  has_BplCard = '';

  dropoutDate: Date;
  dropoutType: string;
  dropoutRemarks: string;

  health_vaccinationStatus: string;
  health_lastDentalCheckup: Date;
  health_lastEyeCheckup: Date;
  health_lastENTCheckup: Date;
  health_eyeHealthStatus: string;
  health_lastVitaminD: Date;
  health_lastDeworming: Date;

  get age(): number {
    let age = -1;

    if (this.dateOfBirth) {
      const now = new Date();
      const dateOfBirth = new Date(this.dateOfBirth);

      age = now.getFullYear() - dateOfBirth.getFullYear();
      const m = now.getMonth() - dateOfBirth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) {
        age--;
      }
    }

    return age;
  }

  isActive(): boolean {
    return this.status !== 'Dropout';
  }


  public toString() {
    return this.name;
  }

  public getPhoto() {
    if (!this.hasPhoto) {
      return 'assets/child.png';
    }
    return 'assets/child-photos/' + this.projectNumber + '.jpg';
  }

  getSchools(entityMapperService: EntityMapperService): Promise<School[]> {
    return entityMapperService.loadTypeForRelation<Child, School, ChildSchoolRelation> (
      Child,
      School,
      ChildSchoolRelation,
      this.getId(),
    );
  }
  getRelations(entityMapperService: EntityMapperService): Promise<ChildSchoolRelation[]> {
    return entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation).then((relations: ChildSchoolRelation[]) => {
      return relations.filter(relation => relation.childId === this.getId());
   })
  }

  getViewableSchools(entityMapperService: EntityMapperService): Promise<ViewableSchool[]> {
    return this.getRelations(entityMapperService).then((relations: ChildSchoolRelation[]) => {
      const schools: ViewableSchool[] = [];
      relations.forEach(async relation => {
        const school: School = await relation.getSchool(entityMapperService);
        schools.push(new ViewableSchool(relation, school));
      });
      return schools;
    });
  }
}


export class ViewableSchool {
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
