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

export class Child extends Entity {

  name: String;
  pn: Number; // project number
  religion: String;
  gender: Boolean; // M or F
  dateOfBirth: string;
  motherTongue: String;
  admission: Date;
  placeOfBirth: String;
  center: String;
  birthCertificate: String;
  currentStatus: {
    projectStatus: String;
    socialworker: String;
    address: {
      text: String;
      visit: String;
      villageAddress: String;
    }
  }

  /*constructor(name: String, pn: Number, religion: String, gender: Boolean, dateOfBirth: string, motherTongue: String, admission: Date, placeOfBirth: String,
  center: String, birthCertificate: String){
    this.name=name;
    this.pn=pn;
    this.religion= religion;
    this.gender=gender;
    this.dateOfBirth=dateOfBirth;
    this.motherTongue=motherTongue;
    this.admission=Date;
    this.placeOfBirth=placeOfBirth;
    this.center=center;
    this.birthCertificate=birthCertificate;
  }

   Not sure if constructor is needed or if Setter-Methods make more sense.
  */

  getPrefix(): string {
    return 'child:';
  }

  age(): number {
     if (this.dateOfBirth) {
                    var now = new Date();
                    var birthdate = new Date(this.dateOfBirth);
                    var diff = now.getTime() - birthdate.getTime();
                    return Math.floor(diff / (1000 * 3600 * 24 * 365));
                }
      return null;
  }

  setName(name: String){
    this.name=name;
  }
  setPN(pn: Number){
    this.pn=pn;
  }

  setReligion(religion: String){
    this.religion=religion;
  }

  setGender(gender: Boolean){
    this.gender=gender;
  }

  setPoB(pob: String){ //set Place of Birth
    this.placeOfBirth=pob;
  }

  setDoB(dob: string){
    this.dateOfBirth=dob;
  }
}
