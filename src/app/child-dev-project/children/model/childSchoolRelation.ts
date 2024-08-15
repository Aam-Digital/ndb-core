import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Child } from "./child";
import { TimePeriod } from "../../../core/entity-details/related-time-period-entities/time-period";

/**
 * Record of a school year that a Child attended a certain class in a School.
 */
@DatabaseEntity("ChildSchoolRelation")
export class ChildSchoolRelation extends TimePeriod {
  static override hasPII = true;

  @DatabaseField({
    label: $localize`:Label for the child of a relation:Child`,
    dataType: "entity",
    additional: Child.ENTITY_TYPE,
    entityReferenceRole: "composite",
    validators: {
      required: true,
    },
    anonymize: "retain",
  })
  childId: string;

  @DatabaseField({
    label: $localize`:Label for the school of a relation:School`,
    dataType: "entity",
    additional: "School",
    entityReferenceRole: "aggregate",
    validators: {
      required: true,
    },
    anonymize: "retain",
  })
  schoolId: string;

  @DatabaseField({ label: $localize`:Label for the class of a relation:Class` })
  schoolClass: string = "";

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the start date of a relation:Start date`,
    description: $localize`:Description of the start date of a relation:The date a child joins a school`,
    anonymize: "retain",
  })
  start: Date;

  @DatabaseField({
    dataType: "date-only",
    label: $localize`:Label for the end date of a relation:End date`,
    description: $localize`:Description of the end date of a relation:The date of a child leaving the school`,
    anonymize: "retain",
  })
  end: Date;

  /** percentage achieved in the final school exams of that year */
  @DatabaseField({
    label: $localize`:Label for the percentage result of a relation:Result`,
    viewComponent: "DisplayPercentage",
    editComponent: "EditNumber",
    validators: {
      min: 0,
      max: 100,
    },
  })
  result: number;
}
