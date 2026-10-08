import { RollCallComponent } from "./roll-call.component";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";

const demoChildren = [generateChild(), generateChild(), generateChild()];
const demoEvent = TestEventEntity.create({
  date: new Date(),
  title: "coaching",
});
demoEvent.attendance = demoChildren.map(
  (c) => new AttendanceItem(undefined, "", c.getId()),
);

function wrap(event: TestEventEntity): EventWithAttendance {
  return new EventWithAttendance(
    event,
    "attendance",
    "date",
    "relatesTo",
    "authors",
    undefined,
  );
}

export default {
  title: "Features/Attendance/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData(demoChildren)),
      ],
    }),
  ],
} as Meta;

export const Primary: StoryObj<RollCallComponent> = {
  args: { eventEntity: wrap(demoEvent) },
};

export const Finished: StoryObj<RollCallComponent> = {
  args: { eventEntity: wrap(new TestEventEntity()) },
};
