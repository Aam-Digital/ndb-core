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
import { Photo } from "../child-photo-service/photo";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { DateWithAge } from "./dateWithAge";
import { IconName } from "@fortawesome/fontawesome-svg-core";

export type Center = ConfigurableEnumValue;

@DatabaseEntity("Child")
export class Child extends Entity {
  static toStringAttributes = ["name"];
  static icon: IconName = "child";
  static label = $localize`:label for entity:Participant`;
  static labelPlural = $localize`:label (plural) for entity:Participants`;
  static color = "#1565C0";

  static create(name: string): Child {
    const instance = new Child();
    instance.name = name;
    return instance;
  }

  static getBlockComponent(): string {
    return "ChildBlock";
  }

  @DatabaseField({
    label: $localize`:Label for the name of a child:Name`,
    validators: {
      required: true,
    },
  })
  name: string;

  @DatabaseField({
    label: $localize`:Label for the project number of a child:Project Number`,
    labelShort: $localize`:Short label for the project number:PN`,
    searchable: true,
  })
  projectNumber: string;

  @DatabaseField({
    label: $localize`:Label for the date of birth of a child:Date of birth`,
    labelShort: $localize`:Short label for the date of birth:DoB`,
  })
  dateOfBirth: DateWithAge;

  @DatabaseField({
    dataType: "configurable-enum",
    label: $localize`:Label for the gender of a child:Gender`,
    innerDataType: "genders",
  })
  gender: ConfigurableEnumValue;

  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: "center",
    label: $localize`:Label for the center of a child:Center`,
  })
  center: Center;

  @DatabaseField({
    label: $localize`:Label for the admission date of a child:Admission`,
  })
  admissionDate: Date;

  @DatabaseField({
    label: $localize`:Label for the status of a child:Status`,
  })
  status: string = "";

  @DatabaseField({
    label: $localize`:Label for the dropout date of a child:Dropout Date`,
  })
  dropoutDate: Date;

  @DatabaseField({
    label: $localize`:Label for the type of dropout of a child:Dropout Type`,
  })
  dropoutType: string;

  @DatabaseField({
    label: $localize`:Label for the remarks about a dropout of a child:Dropout remarks`,
  })
  dropoutRemarks: string;

  /** current school (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolId: string[] = [];
  /** current class (as determined through the ChildSchoolRelation docs) set during loading through ChildrenService */
  schoolClass: string;

  @DatabaseField({
    dataType: "photo",
    defaultValue: "",
    label: $localize`:Label for the filename of a photo of a child:Photo Filename`,
  })
  photo: Photo = {
    path: "",
    photo: new BehaviorSubject<SafeUrl>(
      ChildPhotoService.getImageFromAssets(undefined)
    ),
  };

  @DatabaseField({
    dataType: "file",
    label: $localize`:Label for the filename of a photo of a child:Photo Filename`,
    editComponent: "NewPhoto",
  })
  photo2: string;

  @DatabaseField({
    label: $localize`:Label for the phone number of a child:Phone Number`,
  })
  phone: string;

  get isActive(): boolean {
    return (
      this.status !== "Dropout" &&
      !this["dropoutDate"] &&
      !this["exit_date"] &&
      super.isActive
    );
  }
}
