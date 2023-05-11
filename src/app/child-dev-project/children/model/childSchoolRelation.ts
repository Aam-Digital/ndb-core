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
    dataType: "entity",
    additional: Child.ENTITY_TYPE,
    validators: {
      required: true,
    },
  })
  childId: string;
  @DatabaseField({
    label: $localize`:Label for the school of a relation:School`,
    dataType: "entity",
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
    label: $localize`:Label for the start date of a relation:Start date`,
    description: $localize`:Description of the start date of a relation:The date a child joins a school`,
  })
  start: Date;
  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the end date of a relation:End date`,
    description: $localize`:Description of the end date of a relation:The date of a child leaving the school`,
  })
  end: Date;

  /** percentage achieved in the final school exams of that year */
  @DatabaseField({
    label: $localize`:Label for the percentage result of a relation:Result`,
    dataType: "percentage",
  })
  result: number;

  /**
   * Returns true if this relation is currently active
   */
  get isActive(): boolean {
    return this.isActiveAt(new Date());
  }

  /**
   * Checks whether this relation was active on a specific date
   * @param date on which the active status should be checked
   */
  isActiveAt(date: Date): boolean {
    return (
      (!this.start || moment(this.start).isSameOrBefore(date, "day")) &&
      (!this.end || moment(this.end).isSameOrAfter(date, "day"))
    );
  }

  getColor(): string {
    return this.isActive ? "#90ee9040" : "";
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
