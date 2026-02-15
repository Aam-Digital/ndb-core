import { ComponentTuple } from "../../dynamic-components";

export const childrenComponents: ComponentTuple[] = [
  [
    "GroupedChildAttendance",
    () =>
      import("./child-details/grouped-child-attendance/grouped-child-attendance.component").then(
        (c) => c.GroupedChildAttendanceComponent,
      ),
  ],
  [
    "DisplayParticipantsCount",
    () =>
      import("./display-participants-count/display-participants-count.component").then(
        (c) => c.DisplayParticipantsCountComponent,
      ),
  ],
];
