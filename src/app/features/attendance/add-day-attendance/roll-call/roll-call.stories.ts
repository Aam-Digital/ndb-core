import { RollCallComponent } from "./roll-call.component";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { EventWithAttendance } from "../../model/event-with-attendance";

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [generateChild(), generateChild(), generateChild()];
demoChildren.forEach((c) => {
  demoEvent.children.push(c.getId());
  demoEvent.childrenAttendance.push(
    new AttendanceItem(undefined, "", c.getId()),
  );
});

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
  args: {
    eventEntity: new EventWithAttendance(
      demoEvent,
      "childrenAttendance",
      "date",
    ),
  },
};

export const Finished: StoryObj<RollCallComponent> = {
  args: {
    eventEntity: new EventWithAttendance(
      new Note(),
      "childrenAttendance",
      "date",
    ),
  },
};
