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
  protected static ENTITY_TYPE = 'Child';

  name = '';
  pn = ''; // project number

  center = 'N/A';
  status = '';
  school: any;
  grade = '99';

  religion: string;
  gender: Gender; // M or F
  dateOfBirth: Date;
  motherTongue: string;
  admission: string;
  placeOfBirth: string;
  birthCertificate: string;
  currentStatus: {
    projectStatus: string;
    socialworker: string;
    address: {
      text: string;
      visit: string;
      villageAddress: string;
    }
  };
  remarks: string; // could also be a feed with text blocks
  address: {
    street: string;
    housename: string;
    district: string;
    city: string;
    postcode: string;
  };

  getAge(): number {
     if (this.dateOfBirth) {
       const now = new Date();
       const dateOfBirth = new Date(this.dateOfBirth);
       const diff = now.getTime() - dateOfBirth.getTime();
       return Math.floor(diff / (1000 * 3600 * 24 * 365));
     }
     return -1;
  }

  isActive(): boolean {
    return this.status !== 'dropout';
  }


}
