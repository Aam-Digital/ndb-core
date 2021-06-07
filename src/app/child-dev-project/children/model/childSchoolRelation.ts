import { Entity } from "../../../core/entity/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import moment from "moment";
import { School } from "../../schools/model/school";
import { FormGroup } from "@angular/forms";

/**
 * Record of a school year that a Child attended a certain class in a School.
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends Entity {
  static validateForm(formGroup: FormGroup) {
    super.validateForm(formGroup);
    const school = formGroup.get("schoolId")?.value;
    const schoolLabel = ChildSchoolRelation.schema.get("schoolId").label;
    const startDate: Date = formGroup.get("start")?.value;
    const startLabel = ChildSchoolRelation.schema.get("start").label;
    const endDate: Date = formGroup.get("end")?.value;
    const endLabel = ChildSchoolRelation.schema.get("end").label;
    if (!school) {
      throw new Error(`No "${schoolLabel}" selected`);
    }
    if (endDate && !startDate) {
      throw new Error(`No "${startLabel}" date is set`);
    } else if (moment(startDate).isAfter(endDate, "days")) {
      throw new Error(
        `The "${startLabel}" date is after the "${endLabel}" date`
      );
    }
  }

  @DatabaseField() childId: string;
  @DatabaseField({
    label: "School",
    viewComponent: "DisplayEntity",
    editComponent: "EditSingleEntity",
    additional: School.ENTITY_TYPE,
  })
  schoolId: string;
  @DatabaseField({ label: "Class" }) schoolClass: string = "";
  @DatabaseField({ dataType: "date-only", label: "From" }) start: Date;
  @DatabaseField({ dataType: "date-only", label: "To" }) end: Date;

  /** percentage achieved in the final school exams of that year */
  @DatabaseField({
    label: "Result",
    viewComponent: "DisplayPercentage",
    editComponent: "EditPercentage",
  })
  result: number;

  get isActive(): boolean {
    return (
      this.start &&
      moment(this.start).isSameOrBefore(moment(), "day") &&
      (!this.end || moment(this.end).isAfter(moment(), "day"))
    );
  }
}
