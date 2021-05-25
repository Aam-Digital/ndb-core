import { Entity } from "../../../core/entity/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import moment from "moment";

/**
 * Record of a school year that a Child attended a certain class in a School.
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends Entity {
  @DatabaseField() childId: string;
  @DatabaseField() schoolId: string = "";
  @DatabaseField() schoolClass: string = "";
  @DatabaseField({ dataType: "date-only" }) start: Date;
  @DatabaseField({ dataType: "date-only" }) end: Date;

  /** percentage achieved in the final school exams of that year */
  @DatabaseField() result: number;

  get isActive(): boolean {
    return (
      this.start &&
      moment(this.start).isSameOrBefore(moment(), "day") &&
      (!this.end || moment(this.end).isAfter(moment(), "day"))
    );
  }
}
