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
import { SafeUrl } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs";

@DatabaseEntity("Child")
export class Child extends Entity {
  /**
   * Returns the full relative filePath to a child photo given a filename, adding the relevant folders to it.
   * @param filename The given filename with file extension.
   */
  public static generatePhotoPath(filename: string): string {
    return "assets/child-photos/" + filename;
  }

  @DatabaseField() name: string;
  @DatabaseField() projectNumber: string; // project number
  @DatabaseField({ dataType: "date-only" }) dateOfBirth: Date;
  @DatabaseField() motherTongue: string = "";
  @DatabaseField({ dataType: "string" }) gender: Gender; // M or F
  @DatabaseField() religion: string = "";

  @DatabaseField() center: string = "";
  @DatabaseField() admissionDate: Date;
  @DatabaseField() status: string = "";

  @DatabaseField() dropoutDate: Date;
  @DatabaseField() dropoutType: string;
  @DatabaseField() dropoutRemarks: string;

  /** current school (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolId: string = "";
  /** current class (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolClass: string = "";

  /**
   * Url to an image that is displayed for the child
   * as a fallback option if no CloudFileService file or connection is available.
   */
  @DatabaseField() photoFile: string;

  @DatabaseField({ dataType: "load-child-photo" })
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
