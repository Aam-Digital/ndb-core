import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import moment from "moment";
import { School } from "../../schools/model/school";

/**
 * Record of a school year that a Child attended a certain class in a School.
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField({
    label: "School",
    viewComponent: "DisplayEntity",
    editComponent: "EditSingleEntity",
    additional: School.ENTITY_TYPE,
    required: true,
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

  assertValid() {
    super.assertValid();
    const startLabel = this.getSchema().get("start").label;
    const endLabel = this.getSchema().get("end").label;
    if (this.end && !this.start) {
      throw new Error(`No "${startLabel}" date is set`);
    } else if (moment(this.start).isAfter(this.end, "days")) {
      throw new Error(
        `The "${startLabel}" date is after the "${endLabel}" date`
      );
    }
  }
}
