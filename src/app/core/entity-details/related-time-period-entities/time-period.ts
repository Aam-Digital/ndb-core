import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";
import moment from "moment";

/**
 * Record that is only active for a given time period.
 */
@DatabaseEntity("TimePeriod")
export class TimePeriod extends Entity {
  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the start date of a relation:Start date`,
    description: $localize`:Description of the start date of a relation:The date from when this is active.`,
  })
  start: Date;

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the end date of a relation:End date`,
    description: $localize`:Description of the end date of a relation:The date after which this is inactive.`,
  })
  end: Date;

  /**
   * Returns true if this relation is currently active
   */
  get isActive(): boolean {
    if (this.inactive) {
      // manual archiving of records takes precendence
      return false;
    }

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

    this.checkValidDateRange();
  }

  private checkValidDateRange() {
    if (!this.end) {
      // without end date, any range is valid
      return;
    }

    const startLabel = this.getSchema().get("start").label;
    const endLabel = this.getSchema().get("end").label;
    if (this.end && !this.start) {
      throw new Error(
        $localize`:Error assertValid failed:No "${startLabel}" date is set`,
      );
    } else if (moment(this.start).isAfter(this.end, "days")) {
      throw new Error(
        $localize`:Error assertValid failed:The "${startLabel}" date is after the "${endLabel}" date`,
      );
    }
  }
}
