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
demoChildren.forEach((c) => simpleEvent.addChild(c.getId()));

const longEvent = Note.create(new Date(), "another meeting");
longEvent.text =
  "a guardians meeting with all families who are in the neighbourhood";
longEvent.category = {
  id: "GUARDIAN_MEETING",
  label: "Guardians Meeting",
  isMeeting: true,
};
demoChildren.forEach((c) => longEvent.addChild(c.getId()));

const activityEvent = Note.create(new Date(), "Coaching Batch C");
activityEvent.relatesTo =
  RecurringActivity.create("Coaching Batch C").getId(true);
demoChildren.forEach((c) => activityEvent.addChild(c.getId()));

export const OneTimeEvent = Template.bind({});
OneTimeEvent.args = {
  event: simpleEvent,
};

export const OneTimeEventComplex = Template.bind({});
OneTimeEventComplex.args = {
  event: longEvent,
};

export const RecurringEvent = Template.bind({});
RecurringEvent.args = {
  event: activityEvent,
};
