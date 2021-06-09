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

import { Entity } from "../../../core/entity/entity";
import { Gender } from "./Gender";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";
import { calculateAge } from "../../../utils/utils";
import { Photo } from "../child-photo-service/photo";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";

export type Center = ConfigurableEnumValue;
@DatabaseEntity("Child")
export class Child extends Entity {
  static create(name: string): Child {
    const instance = new Child();
    instance.name = name;
    return instance;
  }

  @DatabaseField() name: string;
  @DatabaseField() projectNumber: string; // project number
  @DatabaseField({ dataType: "date-only" }) dateOfBirth: Date;
  @DatabaseField() motherTongue: string = "";
  @DatabaseField({ dataType: "string" }) gender: Gender; // M or F
  @DatabaseField() religion: string = "";

  @DatabaseField() center: Center;
  @DatabaseField() admissionDate: Date;
  @DatabaseField() status: string = "";

  @DatabaseField() dropoutDate: Date;
  @DatabaseField() dropoutType: string;
  @DatabaseField() dropoutRemarks: string;

  /** current school (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolId: string = "";
  /** current class (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolClass: string = "";

  @DatabaseField({
    dataType: "photo",
    defaultValue: ChildPhotoService.getDefaultImage(),
  })
  photo: Photo;

  get age(): number {
    return this.dateOfBirth ? calculateAge(this.dateOfBirth) : null;
  }

  get isActive(): boolean {
    return (
      this.status !== "Dropout" && !this["dropoutDate"] && !this["exit_date"]
    );
  }

  /**
   * @override see {@link Entity}
   */
  @DatabaseField() get searchIndices(): string[] {
    let indices = [];

    if (this.name !== undefined) {
      indices = indices.concat(this.name.split(" "));
    }
    if (this.projectNumber !== undefined) {
      indices.push(this.projectNumber);
    }

    return indices;
  }
  set searchIndices(value) {}

  public toString() {
    return this.name;
  }
}

export function sortByChildClass(a: Child, b: Child) {
  {
    if (a.schoolClass === b.schoolClass) {
      return 0;
    }

    const diff = parseInt(b.schoolClass, 10) - parseInt(a.schoolClass, 10);
    if (!Number.isNaN(diff)) {
      return diff;
    }

    if (a.schoolClass < b.schoolClass || b.schoolClass === undefined) {
      return 1;
    }
    return -1;
  }
}
