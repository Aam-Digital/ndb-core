import { School } from "../../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { AdditionalImportAction } from "../import-additional-actions/additional-import-action";
import { Entity } from "../../entity/model/entity";
import { ColumnMapping } from "../column-mapping";
import { genders } from "../../../child-dev-project/children/model/genders";
import { ImportMetadata } from "../import-metadata";
import { TEST_USER } from "../../user/demo-user-generator.service";

/**
 * Sample raw data that can be used in Storybook and tests.
 */
export const IMPORT_SAMPLE_RAW_DATA: any[] = [
  {
    name: "John Doe",
    birthDate: "2001-01-31",
    gender: "M",
    remarks: "foo bar",
  },
];

export const IMPORT_SAMPLE_COLUMN_MAPPING: ColumnMapping[] = Object.keys(
  IMPORT_SAMPLE_RAW_DATA[0],
).map((k) => ({
  column: k,
}));
IMPORT_SAMPLE_COLUMN_MAPPING.find((c) => c.column === "name").propertyName =
  "name";
IMPORT_SAMPLE_COLUMN_MAPPING.find(
  (c) => c.column === "birthDate",
).propertyName = "dateOfBirth";
Object.assign(
  IMPORT_SAMPLE_COLUMN_MAPPING.find((c) => c.column === "gender"),
  {
    propertyName: "gender",
    additional: { M: genders.find(({ id }) => id === "M") },
  },
);

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
      (e) => e.getType() === "School",
    ).getId(),
  },
  {
    type: "RecurringActivity",
    id: IMPORT_SAMPLE_LINKABLE_DATA.find(
      (e) => e.getType() === "RecurringActivity",
    ).getId(),
  },
];

export const IMPORT_SAMPLE_PREVIOUS_IMPORTS: ImportMetadata[] = [
  ImportMetadata.create({
    created: { by: TEST_USER, at: new Date("2022-12-27") },
    ids: ["1", "2", "3"],
    config: {
      entityType: "Child",
      columnMapping: IMPORT_SAMPLE_COLUMN_MAPPING,
    },
  }),
  ImportMetadata.create({
    created: { by: TEST_USER, at: new Date("2023-01-04") },
    ids: ["1", "3"],
    config: { entityType: "School", columnMapping: [] },
  }),
];
