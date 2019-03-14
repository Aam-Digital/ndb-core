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

  public generateSearchIndices(): string[] {
    let indices = [];

    if (this.name !== undefined) {
      indices = indices.concat(this.name.split(' '));
    }
    if (this.projectNumber !== undefined) {
      indices.push(this.projectNumber);
    }

    return indices;
  }

  public getPhoto() {
    if (!this.hasPhoto) {
      return 'assets/child.png';
    }
    return 'assets/child-photos/' + this.projectNumber + '.jpg';
  }

}
