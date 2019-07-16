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
import {DatabaseEntity} from '../entity/database-entity.decorator';
import {DatabaseField} from '../entity/database-field.decorator';

@DatabaseEntity('Child')
export class Child extends Entity {
  /**
   * Returns the full relative filePath to a child photo given a filename, adding the relevant folders to it.
   * @param filename The given filename with file extension.
   */
  public static generatePhotoPath(filename: string): string {
    return 'assets/child-photos/' + filename;
  }

  @DatabaseField() name: string;
  @DatabaseField() projectNumber: string; // project number
  @DatabaseField({dataType: 'string'}) gender: Gender; // M or F
  @DatabaseField() dateOfBirth: Date;
  @DatabaseField() motherTongue = '';
  @DatabaseField() religion = '';

  @DatabaseField() photoFile: string;

  @DatabaseField() center = '';
  @DatabaseField() admissionDate: Date;
  @DatabaseField() status = '';

  // TODO: remove in favour of ChildSchoolRelations once all bugs are fixed
  @DatabaseField() schoolId = '';
  @DatabaseField() schoolClass = '';

  @DatabaseField() address = '';
  @DatabaseField() phone = '';
  @DatabaseField() guardianName = '';
  @DatabaseField() preferredTimeForGuardianMeeting = '';

  @DatabaseField() has_aadhar = '';
  @DatabaseField() has_bankAccount = '';
  @DatabaseField() has_kanyashree = '';
  @DatabaseField() has_rationCard = '';
  @DatabaseField() has_BplCard = '';

  @DatabaseField() dropoutDate: Date;
  @DatabaseField() dropoutType: string;
  @DatabaseField() dropoutRemarks: string;

  @DatabaseField() health_vaccinationStatus: string;
  @DatabaseField() health_bloodGroup: string;
  @DatabaseField() health_lastDentalCheckup: Date;
  @DatabaseField() health_lastEyeCheckup: Date;
  @DatabaseField() health_lastENTCheckup: Date;
  @DatabaseField() health_eyeHealthStatus: string;
  @DatabaseField() health_lastVitaminD: Date;
  @DatabaseField() health_lastDeworming: Date;

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
    if (!this.photoFile) {
      return 'assets/child.png';
    }
    return Child.generatePhotoPath(this.photoFile);
  }
}
