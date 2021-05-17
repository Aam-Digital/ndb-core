import { Entity } from "../../../core/entity/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

@DatabaseEntity("School")
export class School extends Entity {
  @DatabaseField({ label: "Name" }) name: string = "";
  @DatabaseField({ label: "Address" }) address: string = "";
  @DatabaseField({ label: "Medium" }) medium: string = "";
  @DatabaseField({ label: "Remarks" }) remarks: string = "";
  @DatabaseField({ label: "Website" }) website: string = "";
  @DatabaseField({
    label: "Private School",
    editComponent: "EditBoolean",
    viewComponent: "DisplayCheckmark",
  })
  privateSchool: boolean;
  @DatabaseField({ label: "Contact Number" }) phone: string = "";
  @DatabaseField({ label: "Teaching up to class" }) upToClass: number;
  @DatabaseField({ label: "Board" }) academicBoard: string = "";
  @DatabaseField({ label: "School Timing" }) timing: string = "";
  @DatabaseField({ label: "Working Days", editComponent: "EditLongText" })
  workingDays: string = "";

  public toString() {
    return this.name;
  }
}
