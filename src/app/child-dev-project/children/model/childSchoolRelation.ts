import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { TimePeriod } from "../../../core/entity-details/related-time-period-entities/time-period";

/**
 * Record of a school year that a Child attended a certain class in a School.
 *
 * This class remains as a stub and in the future will be further refactored
 * TODO: refactor into generic time-period based relationship entity --> #2512
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends TimePeriod {
  static override label = "School Enrollment";
  static override labelPlural = "School Enrollments";
  static override hasPII = true;

  @DatabaseField({
    dataType: "entity",
    additional: "Child",
    entityReferenceRole: "composite",
    validators: {
      required: true,
    },
    anonymize: "retain",
  })
  childId: string;

  @DatabaseField({
    dataType: "entity",
    additional: "School",
    entityReferenceRole: "aggregate",
    validators: {
      required: true,
    },
    anonymize: "retain",
  })
  schoolId: string;

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the start date of a relation:Start date`,
    description: $localize`:Description of the start date of a relation:The date a child joins a school`,
    anonymize: "retain",
  })
  declare start: Date;

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the end date of a relation:End date`,
    description: $localize`:Description of the end date of a relation:The date of a child leaving the school`,
    anonymize: "retain",
  })
  declare end: Date;
}
