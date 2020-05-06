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

import { Entity } from '../../../core/entity/entity';
import { Gender } from './Gender';
import { DatabaseEntity } from '../../../core/entity/database-entity.decorator';
import { DatabaseField } from '../../../core/entity/database-field.decorator';
import { SafeUrl } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

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
  @DatabaseField({dataType: 'date-only'}) dateOfBirth: Date;
  @DatabaseField() motherTongue: string = '';
  @DatabaseField() religion: string = '';

  @DatabaseField() center: string = '';
  @DatabaseField() admissionDate: Date;
  @DatabaseField() status: string = '';

  // TODO: remove in favour of ChildSchoolRelations once all bugs are fixed
  schoolId: string = '';
  schoolClass: string = '';

  @DatabaseField() address: string = '';
  @DatabaseField() phone: string = '';
  @DatabaseField() guardianName: string = '';
  @DatabaseField() preferredTimeForGuardianMeeting: string = '';

  @DatabaseField() has_aadhar: string = '';
  @DatabaseField() has_bankAccount: string = '';
  @DatabaseField() has_kanyashree: string = '';
  @DatabaseField() has_rationCard: string = '';
  @DatabaseField() has_BplCard: string = '';

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

  /**
   * Url to an image that is displayed for the child
   * as a fallback option if no CloudFileService file or connection is available.
   */
  @DatabaseField() photoFile: string;

  @DatabaseField({ dataType: 'load-child-photo' })
  photo: BehaviorSubject<SafeUrl>;

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
}
