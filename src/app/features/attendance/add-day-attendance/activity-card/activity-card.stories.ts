import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { ActivityCardComponent } from "./activity-card.component";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";

export default {
  title: "Features/Attendance/Components/ActivityCard",
  component: ActivityCardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const demoChildren = [generateChild(), generateChild(), generateChild()];

function withParticipants(event: TestEventEntity): EventWithAttendance {
  event.attendance = demoChildren.map(
    (c) => new AttendanceItem(undefined, "", c.getId()),
  );
  return new EventWithAttendance(
    event,
    "attendance",
    "date",
    "relatesTo",
    "authors",
    undefined,
  );
}

const simpleEvent = TestEventEntity.create({
  date: new Date(),
  title: "some meeting",
});

const longEvent = TestEventEntity.create({
  date: new Date(),
  title:
    "a guardians meeting with all families who are in the neighbourhood",
});

const activityEvent = TestEventEntity.create({
  date: new Date(),
  title: "Coaching Batch C",
  relatesTo: createEntityOfType("RecurringActivity").getId(),
});

export const OneTimeEvent: StoryObj<ActivityCardComponent> = {
  args: { event: withParticipants(simpleEvent) },
};

export const OneTimeEventComplex: StoryObj<ActivityCardComponent> = {
  args: { event: withParticipants(longEvent) },
};

export const RecurringEvent: StoryObj<ActivityCardComponent> = {
  args: { event: withParticipants(activityEvent) },
};
