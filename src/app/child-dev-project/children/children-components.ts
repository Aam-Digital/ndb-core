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
    "RecentAttendanceBlocks",
    () =>
      import("../attendance/recent-attendance-blocks/recent-attendance-blocks.component").then(
        (c) => c.RecentAttendanceBlocksComponent,
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
