import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { ActivityCardComponent } from "./activity-card.component";
import { Note } from "../../notes/model/note";
import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { RecurringActivity } from "../model/recurring-activity";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

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

const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];

const simpleEvent = Note.create(new Date(), "some meeting");
demoChildren.forEach((c) => simpleEvent.addChild(c));

const longEvent = Note.create(new Date(), "another meeting");
longEvent.text =
  "a guardians meeting with all families who are in the neighbourhood";
longEvent.category = {
  id: "GUARDIAN_MEETING",
  label: "Guardians Meeting",
  isMeeting: true,
};
demoChildren.forEach((c) => longEvent.addChild(c));

const activityEvent = Note.create(new Date(), "Coaching Batch C");
activityEvent.relatesTo = RecurringActivity.create("Coaching Batch C").getId();
demoChildren.forEach((c) => activityEvent.addChild(c));

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
