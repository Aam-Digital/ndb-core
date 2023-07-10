import { School } from "../../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { Entity } from "../../../core/entity/model/entity";
import { ColumnMapping } from "../column-mapping";

/**
 * Sample raw data that can be used in Storybook and tests.
 */
export const IMPORT_SAMPLE_RAW_DATA: any[] = [
  {
    name: "John Doe",
    birthDate: "2001-01-31",
    gender: "M",
  },
];

export const IMPORT_SAMPLE_COLUMN_MAPPING: ColumnMapping[] = Object.keys(
  IMPORT_SAMPLE_RAW_DATA[0]
).map((k) => ({
  column: k,
}));
IMPORT_SAMPLE_COLUMN_MAPPING.find((c) => c.column === "name").propertyName =
  "name";
IMPORT_SAMPLE_COLUMN_MAPPING.find(
  (c) => c.column === "birthDate"
).propertyName = "dateOfBirth";

export const IMPORT_SAMPLE_LINKABLE_DATA: Entity[] = [
  School.create({ name: "Sample School" }),
  School.create({ name: "ABCD School" }),
  RecurringActivity.create("Activity X"),
  RecurringActivity.create("Activity Y"),
];

export const IMPORT_SAMPLE_ADDITIONAL_ACTIONS: AdditionalImportAction[] = [
  {
    type: "School",
    id: IMPORT_SAMPLE_LINKABLE_DATA.find(
      (e) => e.getType() === "School"
    ).getId(),
  },
  {
    type: "RecurringActivity",
    id: IMPORT_SAMPLE_LINKABLE_DATA.find(
      (e) => e.getType() === "RecurringActivity"
    ).getId(),
  },
];
