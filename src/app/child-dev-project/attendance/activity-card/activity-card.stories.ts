import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { ActivityCardComponent } from "./activity-card.component";
import { Note } from "../../notes/model/note";
import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { MatCardModule } from "@angular/material/card";
import { RecurringActivity } from "../model/recurring-activity";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

export default {
  title: "Attendance/Components/ActivityCard",
  component: ActivityCardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        MatCardModule,
        MatTooltipModule,
        BrowserAnimationsModule,
        FontAwesomeIconsModule,
      ],
    }),
  ],
} as Meta;

const Template: Story<ActivityCardComponent> = (
  args: ActivityCardComponent
) => ({
  component: ActivityCardComponent,
  props: args,
});

const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => addDefaultChildPhoto(c));

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
activityEvent.relatesTo = RecurringActivity.create("Coaching Batch C")._id;
demoChildren.forEach((c) => activityEvent.addChild(c.getId()));

export const OneTimeEvent = Template.bind({});
OneTimeEvent.args = {
  event: simpleEvent,
};

export const Highlighted = Template.bind({});
Highlighted.args = {
  event: simpleEvent,
  highlighted: true,
};

export const OneTimeEventComplex = Template.bind({});
OneTimeEventComplex.args = {
  event: longEvent,
};

export const RecurringEvent = Template.bind({});
RecurringEvent.args = {
  event: activityEvent,
};
