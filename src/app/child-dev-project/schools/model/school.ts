import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

@DatabaseEntity("School")
export class School extends Entity {
  static getBlockComponent(): string {
    return "SchoolBlock";
  }

  @DatabaseField({
    label: $localize`:Label for the name of a school:Name`,
    required: true,
  })
  name: string = "";
  @DatabaseField({
    label: $localize`:Label for the address of a school:Address`,
  })
  address: string = "";
  @DatabaseField({ label: $localize`:Label for the medium of a school:Medium` })
  medium: string = "";
  @DatabaseField({
    label: $localize`:Label for the remarks of a school:Remarks`,
  })
  remarks: string = "";
  @DatabaseField({
    label: $localize`:Label for the website of a school:Website`,
  })
  website: string = "";
  @DatabaseField({
    label: $localize`:Label whether school is private:Private School`,
  })
  privateSchool: boolean;
  @DatabaseField({
    label: $localize`:Label for the contact number of a school:Contact Number`,
  })
  phone: string = "";
  @DatabaseField({
    label: $localize`:Label up to which class a school is teaching:Teaching up to class`,
  })
  upToClass: number;
  @DatabaseField({
    label: $localize`:Label for the academic board of a school:Board`,
  })
  academicBoard: string = "";
  @DatabaseField({
    label: $localize`:Label for the times of a school:School Timing`,
  })
  timing: string = "";
  @DatabaseField({
    label: $localize`:Label for the working days of a school:Working Days`,
    editComponent: "EditLongText",
  })
  workingDays: string = "";

  public toString() {
    return this.name;
  }
}
