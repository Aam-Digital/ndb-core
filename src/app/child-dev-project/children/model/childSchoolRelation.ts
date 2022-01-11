import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import moment from "moment";
import { School } from "../../schools/model/school";
import { Child } from "./child";

/**
 * Record of a school year that a Child attended a certain class in a School.
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends Entity {
  @DatabaseField({
    label: $localize`:Label for the child of a relation:Child`,
    viewComponent: "DisplayEntity",
    editComponent: "EditSingleEntity",
    additional: Child.ENTITY_TYPE,
    validators: {
      required: true,
    },
  })
  childId: string;
  @DatabaseField({
    label: $localize`:Label for the school of a relation:School`,
    viewComponent: "DisplayEntity",
    editComponent: "EditSingleEntity",
    additional: School.ENTITY_TYPE,
    validators: {
      required: true,
    },
  })
  schoolId: string;
  @DatabaseField({ label: $localize`:Label for the class of a relation:Class` })
  schoolClass: string = "";
  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the start date of a relation:From`,
    description: $localize`:Description of the start date of a relation:The date a child joins a school`,
  })
  start: Date;
  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the end date of a relation:To`,
    description: $localize`:Description of the end date of a relation:The date of a child leaving the school`,
  })
  end: Date;

  /** percentage achieved in the final school exams of that year */
  @DatabaseField({
    label: $localize`:Label for the percentage result of a relation:Result`,
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
      throw new Error(
        $localize`:Error assertValid failed:No "${startLabel}" date is set`
      );
    } else if (moment(this.start).isAfter(this.end, "days")) {
      throw new Error(
        $localize`:Error assertValid failed:The "${startLabel}" date is after the "${endLabel}" date`
      );
    }
  }
}
