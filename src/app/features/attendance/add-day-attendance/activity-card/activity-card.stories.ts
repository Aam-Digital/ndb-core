import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { ActivityCardComponent } from "./activity-card.component";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";

export default {
  title: "Features/Attendance/Components/ActivityCard",
  component: ActivityCardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<ActivityCardComponent> = (
  args: ActivityCardComponent,
) => ({
  component: ActivityCardComponent,
  props: args,
});

const demoChildren = [generateChild(), generateChild(), generateChild()];

const simpleEvent = Note.create(new Date(), "some meeting");
demoChildren.forEach((c) => {
  simpleEvent.children.push(c.getId());
  simpleEvent.childrenAttendance.push(
    new AttendanceItem(undefined, "", c.getId()),
  );
});

const longEvent = Note.create(new Date(), "another meeting");
longEvent.text =
  "a guardians meeting with all families who are in the neighbourhood";
longEvent.category = {
  id: "GUARDIAN_MEETING",
  label: "Guardians Meeting",
  isMeeting: true,
};
demoChildren.forEach((c) => {
  longEvent.children.push(c.getId());
  longEvent.childrenAttendance.push(
    new AttendanceItem(undefined, "", c.getId()),
  );
});

const activityEvent = Note.create(new Date(), "Coaching Batch C");
activityEvent.relatesTo = RecurringActivity.create("Coaching Batch C").getId();
demoChildren.forEach((c) => {
  activityEvent.children.push(c.getId());
  activityEvent.childrenAttendance.push(
    new AttendanceItem(undefined, "", c.getId()),
  );
});

export const OneTimeEvent = {
  render: Template,

  args: {
    event: simpleEvent,
  },
};

export const OneTimeEventComplex = {
  render: Template,

  args: {
    event: longEvent,
  },
};

export const RecurringEvent = {
  render: Template,

  args: {
    event: activityEvent,
  },
};
