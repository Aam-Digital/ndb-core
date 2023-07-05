import { School } from "../../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";

/**
 * Sample raw data that can be used in Storybook and tests.
 */
export const IMPORT_SAMPLE_RAW_DATA = {
  data: [
    {
      name: "John Doe",
      dateOfBirth: "2001-01-31",
      gender: "M",
    },
  ],
  fields: ["name", "dateOfBirth", "gender"],
};

export const IMPORT_SAMPLE_LINKABLE_DATA = [
  School.create({ name: "Sample School" }),
  School.create({ name: "ABCD School" }),
  RecurringActivity.create("Activity X"),
  RecurringActivity.create("Activity Y"),
];
