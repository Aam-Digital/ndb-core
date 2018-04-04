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
import { Gender} from "./Gender";


export class Child extends Entity {
  name: String;
  phoneNumber: String;
  attendance: number;
  class: string; // ??
  medium: String; // = motherTongue ?
  workingDays: number // datatype ?
  marks: string; // datatype? how many values?
  pn: Number; // project number
  //religion: String;
  gender: Gender;
  dateOfBirth: string;
  motherTongue: String;  // = medium ?
  admission: string;  // old attribute
  placeOfBirth: String; // old attribute
  center: String; // old attribute
  religion: String; // old attribute
  //birthCertificate: String; // old attribute
  //photo: String // ??
  /*currentStatus: {
    projectStatus: String;
    socialworker: String;
    address: {
      text: String;
      visit: String;
      villageAddress: String;
    }
  } */
  remarks: String; //Could also be a feed with text blocks
  adress: String;
  // guardian: List; // store id of guardians
  school: String; // id of school

  //feed

  getPrefix(): string {
    return 'child:';
  }

  age(): number {
     if (this.dateOfBirth) {
                    var now = new Date();
                    var dateOfBirth = new Date(this.dateOfBirth);
                    var diff = now.getTime() - dateOfBirth.getTime();
                    return Math.floor(diff / (1000 * 3600 * 24 * 365));
                }
      return null;
  }


}
