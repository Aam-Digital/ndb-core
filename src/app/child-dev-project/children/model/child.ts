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

import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";
import { calculateAge } from "../../../utils/utils";
import { Photo } from "../child-photo-service/photo";

export type Center = ConfigurableEnumValue;
@DatabaseEntity("Child")
export class Child extends Entity {
  static create(name: string): Child {
    const instance = new Child();
    instance.name = name;
    return instance;
  }

  static getBlockComponent(): string {
    return "ChildBlock";
  }

  @DatabaseField({ label: "Name", required: true }) name: string;
  @DatabaseField({ label: "Project Number", labelShort: "PN" })
  projectNumber: string;
  @DatabaseField({
    dataType: "date-only",
    label: "Date of birth",
    labelShort: "DoB",
    editComponent: "EditAge",
  })
  dateOfBirth: Date;
  @DatabaseField({ label: "Mother Tongue" }) motherTongue: string = "";
  @DatabaseField({
    dataType: "configurable-enum",
    label: "Gender",
    innerDataType: "genders",
  })
  gender: ConfigurableEnumValue;
  @DatabaseField({ label: "Religion" }) religion: string = "";

  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: "center",
    label: "Center",
  })
  center: Center;
  @DatabaseField({ label: "Admission" }) admissionDate: Date;
  @DatabaseField({ label: "Status" }) status: string = "";

  @DatabaseField({ label: "Dropout Date" }) dropoutDate: Date;
  @DatabaseField({ label: "Dropout Type" }) dropoutType: string;
  @DatabaseField({ label: "Dropout remarks" }) dropoutRemarks: string;

  /** current school (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolId: string = "";
  /** current class (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolClass: string = "";

  @DatabaseField({
    dataType: "photo",
    defaultValue: "",
    label: "Photo Filename",
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
